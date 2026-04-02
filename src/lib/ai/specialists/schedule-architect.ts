import { anthropic } from '../client';
import { SCHEDULE_ARCHITECT_PROMPT, specialistTools } from '../prompts';
import type { Message } from '@anthropic-ai/sdk/resources/messages';
import type {
  GatheringContext,
  CuratedMeals,
  CuratedActivities,
  AgendaVariant,
  AgendaDay,
  AgendaBlockSuggestion,
} from '../types';
import type { AgendaConfiguration } from '../agenda-config';
import { getApproachById } from '../agenda-config';

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 4096;

interface RawBlock {
  start_time: string;
  end_time: string;
  title: string;
  description?: string;
  type: string;
  restaurant?: AgendaBlockSuggestion['restaurant'];
  activity?: AgendaBlockSuggestion['activity'];
}

interface RawDay {
  day_number: number;
  blocks: RawBlock[];
}

interface RawAgenda {
  variant_name: string;
  variant_description: string;
  days: RawDay[];
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

function mapToAgendaVariant(raw: RawAgenda, color: string): AgendaVariant {
  return {
    variantName: raw.variant_name,
    variantDescription: raw.variant_description,
    color,
    recommended: false,
    days: raw.days.map((day): AgendaDay => ({
      dayNumber: day.day_number,
      blocks: day.blocks.map((block): AgendaBlockSuggestion => ({
        startTime: block.start_time,
        endTime: block.end_time,
        title: block.title,
        description: block.description,
        type: block.type,
        restaurant: block.restaurant,
        activity: block.activity,
      })),
    })),
  };
}

interface ScheduleArchitectOptions {
  feedback?: string[];
  previous?: AgendaVariant;
}

export async function scheduleArchitect(
  context: GatheringContext,
  meals: CuratedMeals,
  activities: CuratedActivities,
  config: AgendaConfiguration,
  options?: ScheduleArchitectOptions,
): Promise<AgendaVariant> {
  const approach = getApproachById(config.approachId);

  const mealsSection = meals.picks.map((p) =>
    `- ${p.mealSlot}: ${p.restaurant.name} (${p.restaurant.cuisine}, ${p.restaurant.price}, ${p.restaurant.distance}) — ${p.reason}`
  ).join('\n');

  const activitiesSection = activities.picks.map((p) =>
    `- ${p.activity.name} at ${p.activity.venue} (${p.activity.duration}, ${p.energyLevel} energy, suggested: ${p.suggestedTimeOfDay}) — ${p.reason}`
  ).join('\n');

  let refinementSection = '';
  if (options?.feedback && options.feedback.length > 0) {
    refinementSection = `\n\nREFINEMENT REQUIRED — The following issues were found in your previous schedule. Fix ONLY these issues. Keep everything else unchanged:
${options.feedback.map((f) => `- ${f}`).join('\n')}`;
  }

  const venueInfo = context.venueAddress
    ? `Base venue: ${context.venueAddress} — work sessions, icebreakers, and free time happen HERE. Only restaurants and off-site activities require travel.`
    : config.proximity.accommodationAddress
      ? `Base venue (hotel): ${config.proximity.accommodationAddress} — work sessions, icebreakers, and free time happen HERE or nearby. Only restaurants and off-site activities require travel.`
      : `Base venue: the team's hotel/event space in ${context.location}. Work sessions, icebreakers, and free time happen at the base venue.`;

  // Calculate expected work/social hours
  const scheduledHoursPerDay = (() => {
    const start = config.schedule.startTimePreference;
    const end = config.schedule.endTimePreference;
    // Rough estimate — parse "9:00 AM" → 9, "9:00 PM" → 21
    const parseHour = (t: string) => {
      const [h] = t.split(':').map(Number);
      return t.includes('PM') && h !== 12 ? h + 12 : h;
    };
    return parseHour(end) - parseHour(start);
  })();

  const [workPct] = approach.workSocialRatio.split('/').map(Number);
  const expectedWorkHours = Math.round((workPct / 100) * scheduledHoursPerDay);
  const expectedSocialHours = scheduledHoursPerDay - expectedWorkHours;

  const userPrompt = `Build a ${context.duration}-day agenda for a ${context.type} gathering.

Group size: ${context.groupSize} people
Location: ${context.location}
${context.purpose ? `Purpose: ${context.purpose}` : ''}
${context.dietarySummary ? `Dietary needs: ${context.dietarySummary}` : ''}

${venueInfo}

Approach: "${approach.name}" (${approach.workSocialRatio} work/social ratio)
${approach.aiInstruction}

RATIO TARGET: ~${expectedWorkHours} hours of work_session blocks and ~${expectedSocialHours} hours of social blocks (icebreaker + activity + meal + free_time) per full day. This ratio is critical — verify it before finalizing.

Schedule: Start at ${config.schedule.startTimePreference}, end by ${config.schedule.endTimePreference}. ${config.schedule.includeBreakfast ? 'Include breakfast.' : 'No breakfast.'}

PRE-SELECTED RESTAURANTS (place in their assigned meal slots):
${mealsSection}

PRE-SELECTED ACTIVITIES (place at suggested times):
${activitiesSection}

Instructions:
- Place each restaurant in its assigned meal slot with the restaurant object data
- Place activities at their suggested times with the activity object data
- Fill remaining time with work_session, icebreaker, free_time, and travel blocks
- Work sessions and icebreakers happen at the BASE VENUE — no travel needed between them
- Add travel blocks (15 min) ONLY when going to/from an off-site restaurant or activity
- Add 10-15 min cooldown buffers after returning from off-site activities before the next session
- Day 1 starts in the afternoon (arrival day) unless duration is 1 day
- Ensure no time overlaps and no back-to-back blocks at different locations
- Set variant_name to "${approach.name}"
${refinementSection}`;

  const tool = specialistTools.build_agenda;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    stream: false,
    system: SCHEDULE_ARCHITECT_PROMPT,
    tools: [tool],
    tool_choice: { type: 'tool', name: 'build_agenda' },
    messages: [{ role: 'user', content: userPrompt }],
  });

  const raw = extractToolInput<RawAgenda>(response, 'build_agenda');
  return mapToAgendaVariant(raw, approach.color);
}
