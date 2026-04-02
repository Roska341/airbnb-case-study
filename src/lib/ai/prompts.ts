/**
 * AI Prompts and Tool Schemas
 *
 * System prompt with guardrails and Anthropic tool_use definitions
 * for structured JSON output. Three tools correspond to three AI
 * features: gathering recommendations, agenda generation, and
 * per-block suggestions.
 */

import type { Tool } from '@anthropic-ai/sdk/resources/messages';

/**
 * Shared system prompt — sets the AI's role and guardrails.
 * Applied to all three endpoints.
 */
export const SYSTEM_PROMPT = `You are a corporate gathering planning assistant for Airbnb.

Rules:
- Return responses ONLY through the provided tool/function calls
- Do not include specific employee names or personal information
- Suggest only activities appropriate for professional settings
- Consider accessibility and inclusivity in all suggestions
- Base restaurant suggestions on the provided dataset only — do not invent venues
- Base activity suggestions on the provided dataset only — do not invent activities
- Consider dietary restrictions when recommending restaurants
- Ensure a mix of high-energy and low-energy activities for accessibility
- Keep icebreakers psychologically safe — no forced vulnerability or embarrassment
- Avoid alcohol-centric activities as defaults
- Use the provided configuration preferences to guide restaurant, activity, and schedule choices
- When hotel proximity is specified, strongly prefer venues within walking distance`;

/**
 * Tool definitions for Anthropic's tool_use feature.
 * Each tool's input_schema defines the structured JSON that Claude must return.
 */
export const tools: Tool[] = [
  {
    name: 'generate_recommendations',
    description:
      'Generate gathering format recommendations based on the team context, purpose, and logistics. Returns a recommended format, rationale, expected outcomes, and risk flags.',
    input_schema: {
      type: 'object' as const,
      properties: {
        format: {
          type: 'string',
          description:
            'Recommended gathering format, e.g. "2-day offsite with mixed work and social blocks"',
        },
        rationale: {
          type: 'string',
          description:
            'Explanation of why this format best fits the stated purpose and team context',
        },
        outcomes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Expected positive outcomes from this gathering format',
        },
        riskFlags: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Potential risks or things to watch out for with this gathering format',
        },
        suggestedDuration: {
          type: 'string',
          description: 'Recommended duration, e.g. "2.5 days" or "3 days"',
        },
      },
      required: ['format', 'rationale', 'outcomes', 'riskFlags', 'suggestedDuration'],
    },
  },
  {
    name: 'generate_agenda',
    description:
      'Generate a complete multi-day gathering agenda variant with day-by-day time blocks. Each block may include a restaurant (for meals) or activity (for team activities) selected from the provided datasets.',
    input_schema: {
      type: 'object' as const,
      properties: {
        variant_name: {
          type: 'string',
          description: 'Name of this agenda variant, e.g. "High-Energy Social"',
        },
        variant_description: {
          type: 'string',
          description: 'Short description of this variant approach',
        },
        days: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              day_number: { type: 'integer', description: 'Day number starting from 1' },
              blocks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    start_time: { type: 'string', description: 'Start time, e.g. "9:00 AM"' },
                    end_time: { type: 'string', description: 'End time, e.g. "10:00 AM"' },
                    title: { type: 'string', description: 'Block title' },
                    description: { type: 'string', description: 'Brief description of the block' },
                    type: {
                      type: 'string',
                      enum: ['icebreaker', 'work_session', 'meal', 'activity', 'free_time', 'travel'],
                      description: 'Block type category',
                    },
                    restaurant: {
                      type: 'object',
                      description: 'Restaurant details for meal blocks (must be from the provided dataset)',
                      properties: {
                        name: { type: 'string' },
                        cuisine: { type: 'string' },
                        rating: { type: 'number' },
                        price: { type: 'string' },
                        dietary: { type: 'array', items: { type: 'string' } },
                        distance: { type: 'string' },
                        reason: { type: 'string', description: 'Why this restaurant fits this gathering' },
                      },
                      required: ['name', 'cuisine', 'rating', 'price', 'dietary', 'distance', 'reason'],
                    },
                    activity: {
                      type: 'object',
                      description: 'Activity details for activity blocks (must be from the provided dataset)',
                      properties: {
                        name: { type: 'string' },
                        venue: { type: 'string' },
                        duration: { type: 'string' },
                        capacity: { type: 'string' },
                        type: { type: 'string' },
                        reason: { type: 'string', description: 'Why this activity fits this gathering' },
                      },
                      required: ['name', 'venue', 'duration', 'capacity', 'type', 'reason'],
                    },
                  },
                  required: ['start_time', 'end_time', 'title', 'type'],
                },
              },
            },
            required: ['day_number', 'blocks'],
          },
          description: 'Array of days, each containing an array of time blocks',
        },
      },
      required: ['variant_name', 'variant_description', 'days'],
    },
  },
  {
    name: 'suggest_block',
    description:
      'Generate a single agenda block suggestion for a specific time slot. May include a restaurant or activity from the provided datasets.',
    input_schema: {
      type: 'object' as const,
      properties: {
        start_time: { type: 'string', description: 'Start time, e.g. "12:00 PM"' },
        end_time: { type: 'string', description: 'End time, e.g. "1:30 PM"' },
        title: { type: 'string', description: 'Block title' },
        description: { type: 'string', description: 'Brief description of the block' },
        type: {
          type: 'string',
          enum: ['icebreaker', 'work_session', 'meal', 'activity', 'free_time', 'travel'],
          description: 'Block type category',
        },
        restaurant: {
          type: 'object',
          description: 'Restaurant details for meal blocks (must be from the provided dataset)',
          properties: {
            name: { type: 'string' },
            cuisine: { type: 'string' },
            rating: { type: 'number' },
            price: { type: 'string' },
            dietary: { type: 'array', items: { type: 'string' } },
            distance: { type: 'string' },
            reason: { type: 'string' },
          },
          required: ['name', 'cuisine', 'rating', 'price', 'dietary', 'distance', 'reason'],
        },
        activity: {
          type: 'object',
          description: 'Activity details for activity blocks (must be from the provided dataset)',
          properties: {
            name: { type: 'string' },
            venue: { type: 'string' },
            duration: { type: 'string' },
            capacity: { type: 'string' },
            type: { type: 'string' },
            reason: { type: 'string' },
          },
          required: ['name', 'venue', 'duration', 'capacity', 'type', 'reason'],
        },
      },
      required: ['start_time', 'end_time', 'title', 'type'],
    },
  },
];

// ── Specialist System Prompts ───────────────────────────────────

export const RESTAURANT_CURATOR_PROMPT = `You are an expert restaurant curator for corporate team gatherings at Airbnb.

Your job is to select and rank restaurants for each meal slot across a multi-day gathering.

Rules:
- Return responses ONLY through the provided tool/function calls
- Select ONLY from the provided restaurant dataset — do not invent venues
- Assign exactly one restaurant per meal slot (breakfast, lunch, dinner per day)
- CRITICAL DIETARY RULE: For EVERY restaurant you select, cross-check its dietary array against ALL reported dietary needs. If the team has "vegetarian" needs, the restaurant MUST list "vegetarian options" in its dietary array. If a restaurant cannot cover all dietary needs, do NOT select it — pick one that can. If no restaurant covers all needs for a slot, pick the best available and report the gap in dietaryGaps.
- Consider group size — prefer restaurants with communal seating or private dining for large groups
- Vary cuisines across meals — avoid repeating the same cuisine type on the same day
- Vary price points — mix casual and upscale based on configuration preferences
- When hotel proximity is enabled, prefer restaurants within 1.5 miles
- Explain WHY each restaurant was selected for its specific slot`;

export const ACTIVITY_PLANNER_PROMPT = `You are a team activity specialist for corporate gatherings at Airbnb.

Your job is to select activities that match the gathering's approach, energy level, group size, and purpose.

Rules:
- Return responses ONLY through the provided tool/function calls
- Select ONLY from the provided activity dataset — do not invent activities
- Ensure all activities can accommodate the group size
- Balance high and low energy activities for accessibility
- Suggest appropriate times of day (e.g., outdoor activities in the morning/afternoon, not late evening)
- Consider the gathering purpose — team bonding needs interactive activities, strategy needs quieter options
- Explain WHY each activity fits this specific gathering`;

export const SCHEDULE_ARCHITECT_PROMPT = `You are a schedule design expert for corporate team gatherings at Airbnb.

You receive pre-selected restaurants and activities. Your job is to place them into optimal time slots and fill gaps with work sessions, icebreakers, free time, and travel blocks.

BASE VENUE CONCEPT:
- The gathering has a base venue (hotel, office, or event space) where most blocks happen
- Work sessions, icebreakers, and free time happen AT the base venue — no travel needed between these
- Only restaurants and off-site activities require travel blocks
- When a block ends at the base venue and the next starts there too, NO travel block is needed
- Add a 15-min travel block ONLY when transitioning between the base venue and an off-site location
- Add a 10-15 min cooldown/transition buffer after high-energy activities or long off-site excursions before the next session

WORK/SOCIAL RATIO ENFORCEMENT:
- You MUST hit the specified work/social ratio. Count total hours.
- "work" = work_session blocks. "social" = icebreaker + activity + meal + free_time blocks.
- For 60/40: if the day has 10 scheduled hours, ~6 hours must be work_session blocks.
- For 80/20: ~8 hours work_session per 10 scheduled hours.
- For 20/80: ~2 hours work_session per 10 scheduled hours.
- After building the schedule, mentally verify the ratio. If it's off by more than 10%, adjust.

Rules:
- Return responses ONLY through the provided tool/function calls
- Do NOT choose new restaurants or activities — only use the pre-selected ones provided
- Place restaurants in their assigned meal slots (match mealSlot field)
- Place activities at their suggested times of day when possible
- Ensure time blocks have realistic durations: meals 60-90 min, work sessions 90-180 min, icebreakers 20-45 min, travel 15-30 min
- Ensure adequate transition time between blocks — no back-to-back blocks at different locations without travel
- Ensure no time overlaps and no impossibly short gaps (< 15 min)
- Day 1 should start in the afternoon (arrival day) unless duration is 1 day
- Honor schedule preferences (start time, end time, include breakfast)
- Include restaurant and activity objects exactly as provided in the pre-selected data`;

export const QUALITY_REVIEWER_PROMPT = `You are an adversarial quality auditor for corporate gathering agendas at Airbnb.

Your job is to find problems, not to be generous. Score the agenda against 6 criteria and be specific about what's wrong and how to fix it.

Scoring criteria (1-10 each):
1. Dietary Coverage: Does every meal have options for all reported dietary restrictions?
2. Schedule Validity: Are there any time overlaps, unrealistic gaps, or impossible transitions?
3. Approach Ratio: Does the work/social balance match the selected approach?
4. Variety: Are restaurant cuisines, activity types, and block types sufficiently varied?
5. Inclusivity: Are all activities accessible? Are there non-alcohol defaults? Are icebreakers psychologically safe?
6. Logistics: Are travel times between venues realistic? Are venues open at scheduled times?

Rules:
- Return responses ONLY through the provided tool/function calls
- Be specific about issues — "Day 2 dinner has no vegetarian option" not "dietary coverage could be better"
- Pass threshold: ALL six scores must be >= 7
- If any score is below 7, set passed to false and list specific issues to fix`;

// ── Specialist Tool Schemas ─────────────────────────────────────

export const specialistTools: Record<string, Tool> = {
  curate_restaurants: {
    name: 'curate_restaurants',
    description: 'Select and rank restaurants for each meal slot across the gathering duration. Return picks with meal-slot assignments, per-pick reasoning, and dietary coverage analysis.',
    input_schema: {
      type: 'object' as const,
      properties: {
        picks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              restaurant: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  cuisine: { type: 'string' },
                  rating: { type: 'number' },
                  price: { type: 'string' },
                  dietary: { type: 'array', items: { type: 'string' } },
                  distance: { type: 'string' },
                },
                required: ['name', 'cuisine', 'rating', 'price', 'dietary', 'distance'],
              },
              mealSlot: { type: 'string', description: 'Format: day{N}_{breakfast|lunch|dinner}, e.g. "day1_dinner"' },
              reason: { type: 'string', description: 'Why this restaurant for this slot' },
              dietaryCoverage: { type: 'array', items: { type: 'string' }, description: 'Which dietary needs this restaurant covers' },
            },
            required: ['restaurant', 'mealSlot', 'reason', 'dietaryCoverage'],
          },
        },
        reasoning: { type: 'string', description: 'Overall curation rationale' },
        dietaryGaps: {
          type: 'array',
          items: { type: 'string' },
          description: 'Dietary needs that could not be fully covered, e.g. "No vegan option for Day 2 dinner"',
        },
      },
      required: ['picks', 'reasoning', 'dietaryGaps'],
    },
  },

  curate_activities: {
    name: 'curate_activities',
    description: 'Select activities matching the gathering approach, energy preferences, group size, and purpose. Return picks with time-of-day recommendations and energy classification.',
    input_schema: {
      type: 'object' as const,
      properties: {
        picks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activity: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  venue: { type: 'string' },
                  duration: { type: 'string' },
                  capacity: { type: 'string' },
                  type: { type: 'string' },
                },
                required: ['name', 'venue', 'duration', 'capacity', 'type'],
              },
              suggestedTimeOfDay: { type: 'string', enum: ['morning', 'afternoon', 'evening'] },
              energyLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
              reason: { type: 'string', description: 'Why this activity fits this gathering' },
            },
            required: ['activity', 'suggestedTimeOfDay', 'energyLevel', 'reason'],
          },
        },
        reasoning: { type: 'string', description: 'Overall selection rationale' },
        energyBalance: {
          type: 'object',
          properties: {
            high: { type: 'integer' },
            medium: { type: 'integer' },
            low: { type: 'integer' },
          },
          required: ['high', 'medium', 'low'],
        },
      },
      required: ['picks', 'reasoning', 'energyBalance'],
    },
  },

  build_agenda: {
    name: 'build_agenda',
    description: 'Build a complete multi-day gathering agenda by placing pre-selected restaurants and activities into optimal time slots and filling gaps with work sessions, icebreakers, free time, and travel blocks.',
    input_schema: {
      type: 'object' as const,
      properties: {
        variant_name: { type: 'string', description: 'Name of the agenda variant' },
        variant_description: { type: 'string', description: 'Short description of this variant' },
        days: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              day_number: { type: 'integer', description: 'Day number starting from 1' },
              blocks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    start_time: { type: 'string', description: 'e.g. "9:00 AM"' },
                    end_time: { type: 'string', description: 'e.g. "10:00 AM"' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    type: {
                      type: 'string',
                      enum: ['icebreaker', 'work_session', 'meal', 'activity', 'free_time', 'travel'],
                    },
                    restaurant: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        cuisine: { type: 'string' },
                        rating: { type: 'number' },
                        price: { type: 'string' },
                        dietary: { type: 'array', items: { type: 'string' } },
                        distance: { type: 'string' },
                        reason: { type: 'string' },
                      },
                      required: ['name', 'cuisine', 'rating', 'price', 'dietary', 'distance', 'reason'],
                    },
                    activity: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        venue: { type: 'string' },
                        duration: { type: 'string' },
                        capacity: { type: 'string' },
                        type: { type: 'string' },
                        reason: { type: 'string' },
                      },
                      required: ['name', 'venue', 'duration', 'capacity', 'type', 'reason'],
                    },
                  },
                  required: ['start_time', 'end_time', 'title', 'type'],
                },
              },
            },
            required: ['day_number', 'blocks'],
          },
        },
      },
      required: ['variant_name', 'variant_description', 'days'],
    },
  },

  review_agenda: {
    name: 'review_agenda',
    description: 'Review a gathering agenda against 6 quality criteria. Return pass/fail, per-criterion scores, specific issues, and summary.',
    input_schema: {
      type: 'object' as const,
      properties: {
        passed: { type: 'boolean', description: 'true if ALL scores >= 7' },
        overallScore: { type: 'number', description: 'Average of 6 criteria (1-10)' },
        scores: {
          type: 'object',
          properties: {
            dietaryCoverage: { type: 'number', description: '1-10' },
            scheduleValidity: { type: 'number', description: '1-10' },
            approachRatio: { type: 'number', description: '1-10' },
            variety: { type: 'number', description: '1-10' },
            inclusivity: { type: 'number', description: '1-10' },
            logistics: { type: 'number', description: '1-10' },
          },
          required: ['dietaryCoverage', 'scheduleValidity', 'approachRatio', 'variety', 'inclusivity', 'logistics'],
        },
        issues: { type: 'array', items: { type: 'string' }, description: 'Specific problems to fix' },
        summary: { type: 'string', description: 'Human-readable review summary' },
      },
      required: ['passed', 'overallScore', 'scores', 'issues', 'summary'],
    },
  },
};
