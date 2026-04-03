import { anthropic, sanitizePromptInput } from '../client';
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
const MAX_TOKENS = 16384;

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

// Icebreaker titles/descriptions that involve personal disclosure — banned
const BANNED_ICEBREAKER_PATTERNS = [
  /\btwo truths\b/i,
  /\bnever have i ever\b/i,
  /\bmost embarrassing\b/i,
  /\btruth or dare\b/i,
  /\bhot seat\b/i,
  /\bsecret talent\b/i,
  /\bguilty pleasure/i,
  /\bmap of me\b/i,
];

const SAFE_ICEBREAKER_REPLACEMENTS = [
  { title: 'Team Trivia Challenge', description: 'Teams compete in rounds of company and industry trivia with quick-fire buzzer rounds.' },
  { title: 'Collaborative Word Association', description: 'Groups build word chains together, competing to create the longest unbroken association sequence.' },
  { title: 'Marshmallow Challenge', description: 'Teams race to build the tallest freestanding structure using spaghetti, tape, and a marshmallow.' },
  { title: 'Reverse Charades', description: 'The whole team acts out clues while one person guesses — a high-energy twist on classic charades.' },
];

function sanitizeIcebreakers(raw: RawAgenda): RawAgenda {
  let replacementIdx = 0;
  return {
    ...raw,
    days: raw.days.map((day) => ({
      ...day,
      blocks: day.blocks.map((block) => {
        // Check all block types — AI could mislabel a banned icebreaker as 'activity'
        const text = `${block.title} ${block.description ?? ''}`;
        const isBanned = BANNED_ICEBREAKER_PATTERNS.some((p) => p.test(text));
        if (!isBanned) return block;
        const replacement = SAFE_ICEBREAKER_REPLACEMENTS[replacementIdx % SAFE_ICEBREAKER_REPLACEMENTS.length];
        replacementIdx++;
        return { ...block, title: replacement.title, description: replacement.description };
      }),
    })),
  };
}

// Parse "9:00 AM" → total minutes from midnight
function parseTimeToMinutes(t: string): number {
  const [hStr, rest] = t.split(':');
  const h = Number(hStr);
  const m = Number(rest?.replace(/\s*(AM|PM)/i, '') ?? 0);
  let hours = h;
  if (t.includes('AM') && h === 12) hours = 0;
  else if (t.includes('PM') && h !== 12) hours = h + 12;
  return hours * 60 + m;
}

// Format total minutes back to "H:MM AM/PM"
function minutesToTime(mins: number): string {
  const totalMins = ((mins % 1440) + 1440) % 1440; // wrap to 0-1439
  let h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m.toString().padStart(2, '0')} ${period}`;
}

function enforceStartTimes(raw: RawAgenda, startTimePreference: string): RawAgenda {
  const targetMinutes = parseTimeToMinutes(startTimePreference);

  return {
    ...raw,
    days: raw.days.map((day) => {
      if (!day.blocks.length) return day;
      const firstStart = parseTimeToMinutes(day.blocks[0].start_time);
      if (firstStart === targetMinutes) return day;

      // Shift ALL blocks by the difference so durations and gaps are preserved
      const delta = targetMinutes - firstStart;
      return {
        ...day,
        blocks: day.blocks.map((block) => ({
          ...block,
          start_time: minutesToTime(parseTimeToMinutes(block.start_time) + delta),
          end_time: minutesToTime(parseTimeToMinutes(block.end_time) + delta),
        })),
      };
    }),
  };
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
    // Serialize the previous agenda so the model knows what to keep/change
    const previousSummary = options.previous
      ? options.previous.days.map((day) => {
          const blocks = (day.blocks ?? []).map((b) => {
            let line = `  ${b.startTime}-${b.endTime}: ${b.title} [${b.type}]`;
            if (b.restaurant) line += ` (restaurant: ${b.restaurant.name})`;
            if (b.activity) line += ` (activity: ${b.activity.name})`;
            return line;
          }).join('\n');
          return `Day ${day.dayNumber}:\n${blocks}`;
        }).join('\n')
      : '';

    refinementSection = `\n\nREFINEMENT REQUIRED — Fix ONLY the listed issues. Keep everything else unchanged.
${previousSummary ? `\nPREVIOUS SCHEDULE:\n${previousSummary}\n` : ''}
Issues to fix:
${options.feedback.map((f) => `- ${f}`).join('\n')}`;
  }

  const safeVenueAddress = context.venueAddress ? sanitizePromptInput(context.venueAddress, 200) : undefined;
  const safeAccommodationAddress = config.proximity.accommodationAddress ? sanitizePromptInput(config.proximity.accommodationAddress, 200) : undefined;

  const venueInfo = safeVenueAddress
    ? `Base venue: ${safeVenueAddress}`
    : safeAccommodationAddress
      ? `Base venue (hotel): ${safeAccommodationAddress}`
      : `Base venue: hotel/event space in ${context.location}`;

  // Calculate expected work/social hours
  const scheduledHoursPerDay = (() => {
    const start = config.schedule.startTimePreference;
    const end = config.schedule.endTimePreference;
    // Parse "9:00 AM" → 9, "9:00 PM" → 21, "12:00 AM" → 0, "12:00 PM" → 12
    const parseHour = (t: string) => {
      const [h] = t.split(':').map(Number);
      if (t.includes('AM') && h === 12) return 0;
      if (t.includes('PM') && h !== 12) return h + 12;
      return h;
    };
    return parseHour(end) - parseHour(start);
  })();

  const [workPct] = approach.workSocialRatio.split('/').map(Number);
  const expectedWorkHours = Math.round((workPct / 100) * scheduledHoursPerDay);
  const expectedSocialHours = scheduledHoursPerDay - expectedWorkHours;

  const safePurpose = context.purpose ? sanitizePromptInput(context.purpose) : undefined;

  // For extreme ratios, add a hard constraint the model can't miss
  const ratioEmphasis = workPct <= 30
    ? `HARD CONSTRAINT: This is a social-first gathering. No more than ${expectedWorkHours}h of work_session blocks per full day. Fill the rest with icebreakers, activities, meals, and free time. Do NOT default to work sessions to fill gaps.`
    : workPct >= 70
      ? `HARD CONSTRAINT: This is a work-first gathering. At least ${expectedWorkHours}h of work_session blocks per full day. Minimize social blocks.`
      : '';

  const userPrompt = `${context.duration}-day ${context.type} gathering, ${context.groupSize} people in ${context.location}.
${safePurpose ? `Purpose: ${safePurpose}` : ''}
${venueInfo}

Approach: "${approach.name}" (${approach.workSocialRatio} work/social)
${approach.aiInstruction}
Ratio target: ~${expectedWorkHours}h work_session, ~${expectedSocialHours}h social per full day.${ratioEmphasis}

Schedule: ${config.schedule.startTimePreference}–${config.schedule.endTimePreference}. EVERY day including Day 1 MUST start at ${config.schedule.startTimePreference}. Do NOT treat Day 1 as an arrival day. ${config.schedule.includeBreakfast ? 'Include breakfast.' : 'No breakfast.'}
${config.food.venueBreakfast ? 'Breakfasts at venue (meal block, no restaurant object).' : ''}
${config.food.venueDinner ? 'Dinners at venue (meal block, no restaurant object).' : ''}

RESTAURANTS:
${mealsSection || 'None — all meals at venue.'}

ACTIVITIES:
${activitiesSection}

variant_name: "${approach.name}"
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

  if (response.stop_reason === 'max_tokens') {
    throw new Error(
      'AI response was truncated (hit max_tokens). The agenda may be too large for a single response. ' +
      `Try reducing the gathering duration or simplifying the configuration.`
    );
  }

  let raw = extractToolInput<RawAgenda>(response, 'build_agenda');

  if (!raw.days || !Array.isArray(raw.days)) {
    throw new Error(
      `AI returned invalid agenda structure: "days" is ${typeof raw.days}. ` +
      `stop_reason: ${response.stop_reason}`
    );
  }

  // Validate each day has a blocks array
  for (const day of raw.days) {
    if (!day.blocks || !Array.isArray(day.blocks)) {
      throw new Error(
        `AI returned a day (day_number: ${day.day_number}) without a valid "blocks" array. ` +
        `Got: ${typeof day.blocks}. stop_reason: ${response.stop_reason}`
      );
    }
  }

  // Post-processing: enforce safe icebreakers and correct start times
  raw = sanitizeIcebreakers(raw);
  raw = enforceStartTimes(raw, config.schedule.startTimePreference);

  return mapToAgendaVariant(raw, approach.color);
}
