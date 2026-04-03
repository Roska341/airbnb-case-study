import { anthropic } from '../client';
import { QUALITY_REVIEWER_PROMPT, specialistTools } from '../prompts';
import type { Message } from '@anthropic-ai/sdk/resources/messages';
import type { GatheringContext, AgendaVariant, ReviewResult } from '../types';
import type { AgendaConfiguration } from '../agenda-config';
import { getApproachById } from '../agenda-config';

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 2048;

function extractToolInput<T>(response: Message, toolName: string): T {
  const toolBlock = response.content.find(
    (block) => block.type === 'tool_use' && block.name === toolName,
  );
  if (!toolBlock || toolBlock.type !== 'tool_use') {
    throw new Error(`AI response did not contain expected tool call "${toolName}".`);
  }
  return toolBlock.input as T;
}

export async function qualityReviewer(
  agenda: AgendaVariant,
  context: GatheringContext,
  config: AgendaConfiguration,
): Promise<ReviewResult> {
  const approach = getApproachById(config.approachId);

  const agendaSummary = agenda.days.map((day) => {
    const blocks = (day.blocks ?? []).map((b) => {
      let detail = `  ${b.startTime}-${b.endTime}: ${b.title} [${b.type}]`;
      if (b.restaurant) detail += ` — Restaurant: ${b.restaurant.name} (${b.restaurant.cuisine}, dietary: ${(b.restaurant.dietary ?? []).join(', ')})`;
      if (b.activity) detail += ` — Activity: ${b.activity.name} at ${b.activity.venue}`;
      return detail;
    }).join('\n');
    return `Day ${day.dayNumber}:\n${blocks}`;
  }).join('\n\n');

  const userPrompt = `Review this ${context.duration}-day ${context.type} gathering agenda.

Group size: ${context.groupSize} people
Location: ${context.location}
${context.dietarySummary ? `Dietary needs: ${context.dietarySummary}` : 'No dietary restrictions reported.'}
Expected approach: "${approach.name}" (${approach.workSocialRatio} work/social ratio)

AGENDA TO REVIEW:
${agendaSummary}

Score each criterion 1-10. Be adversarial — find real problems. Set passed=true only if ALL scores are >= 7.`;

  const tool = specialistTools.review_agenda;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    stream: false,
    system: QUALITY_REVIEWER_PROMPT,
    tools: [tool],
    tool_choice: { type: 'tool', name: 'review_agenda' },
    messages: [{ role: 'user', content: userPrompt }],
  });

  return extractToolInput<ReviewResult>(response, 'review_agenda');
}
