import { anthropic, sanitizePromptInput } from '../client';
import { ACTIVITY_PLANNER_PROMPT, specialistTools } from '../prompts';
import type { Message } from '@anthropic-ai/sdk/resources/messages';
import type { GatheringContext, CuratedActivities } from '../types';
import type { AgendaConfiguration, ActivityType } from '../agenda-config';
import { getApproachById } from '../agenda-config';

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 4096;

interface ActivityData {
  name: string;
  venue: string;
  duration: string;
  capacity: string;
  type: string;
  reason: string;
}

function extractToolInput<T>(response: Message, toolName: string): T {
  const toolBlock = response.content.find(
    (block) => block.type === 'tool_use' && block.name === toolName,
  );
  if (!toolBlock || toolBlock.type !== 'tool_use') {
    throw new Error(`AI response did not contain expected tool call "${toolName}".`);
  }
  return toolBlock.input as T;
}

export async function activityPlanner(
  context: GatheringContext,
  activities: ActivityData[],
  config: AgendaConfiguration,
): Promise<CuratedActivities> {
  const approach = getApproachById(config.approachId);

  // Pre-filter by activity type (soft filter)
  let filtered = [...activities];
  if (config.activities.typePreferences.length > 0) {
    const typeFiltered = filtered.filter((a) =>
      config.activities.typePreferences.includes(a.type as ActivityType),
    );
    if (typeFiltered.length > 0) filtered = typeFiltered;
  }

  // Filter by capacity
  const capFiltered = filtered.filter((a) => {
    const cap = parseInt(a.capacity.replace(/\D/g, ''));
    return isNaN(cap) || cap >= context.groupSize;
  });
  if (capFiltered.length > 0) filtered = capFiltered;

  const userPrompt = `Select activities for a ${context.duration}-day ${context.type} gathering.

Expected group size: ${context.groupSize} people
Location: ${context.location}
${context.purpose ? `Purpose: ${sanitizePromptInput(context.purpose)}` : ''}

Approach: "${approach.name}" (${approach.workSocialRatio} work/social ratio)
${approach.aiInstruction}

Preferences:
- Activity types: ${config.activities.typePreferences.length > 0 ? config.activities.typePreferences.join(', ') : 'any'}
- Energy level: ${config.activities.energyLevel}

AVAILABLE ACTIVITIES (select ONLY from this list):
${JSON.stringify(filtered, null, 2)}

Select 2-4 activities for a ${context.duration}-day gathering. Balance high and low energy. Suggest the best time of day for each.`;

  const tool = specialistTools.curate_activities;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    stream: false,
    system: ACTIVITY_PLANNER_PROMPT,
    tools: [tool],
    tool_choice: { type: 'tool', name: 'curate_activities' },
    messages: [{ role: 'user', content: userPrompt }],
  });

  if (response.stop_reason === 'max_tokens') {
    throw new Error('Activity planning response was truncated (hit max_tokens).');
  }

  const result = extractToolInput<CuratedActivities>(response, 'curate_activities');

  if (!result.picks || !Array.isArray(result.picks)) {
    throw new Error(`AI returned invalid activity curation: "picks" is ${typeof result.picks}.`);
  }

  return result;
}
