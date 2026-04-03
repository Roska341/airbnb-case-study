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
- Keep icebreakers strictly professional and psychologically safe — no personal disclosure games (e.g. "Two truths and a lie", "Never have I ever"), no forced vulnerability or embarrassment. Use only work-appropriate formats like quick team trivia, word associations, or collaborative problem-solving exercises
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
                    description: { type: 'string', description: 'Concrete 1-sentence description of what happens' },
                    type: {
                      type: 'string',
                      enum: ['icebreaker', 'work_session', 'meal', 'activity', 'free_time', 'travel'],
                    },
                    restaurant: {
                      type: 'object',
                      description: 'Restaurant for meal blocks (from dataset)',
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
                  required: ['start_time', 'end_time', 'title', 'description', 'type'],
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
        description: { type: 'string', description: 'Concrete 1-sentence description of what happens' },
        type: {
          type: 'string',
          enum: ['icebreaker', 'work_session', 'meal', 'activity', 'free_time', 'travel'],
        },
        restaurant: {
          type: 'object',
          description: 'Restaurant for meal blocks (from dataset)',
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
      required: ['start_time', 'end_time', 'title', 'description', 'type'],
    },
  },
];

// ── Specialist System Prompts ───────────────────────────────────

export const RESTAURANT_CURATOR_PROMPT = `You are a restaurant curator for corporate team gatherings at Airbnb.

Select and rank restaurants for each meal slot. One restaurant per slot.

Rules:
- Return responses ONLY through the provided tool/function calls
- Select ONLY from the provided dataset — do not invent venues
- Cross-check each restaurant's dietary array against reported needs. If a restaurant can't cover all needs, report gaps in dietaryGaps
- If no dietary needs are reported, leave dietaryCoverage and dietaryGaps as empty arrays — don't invent restrictions
- Vary cuisines across meals on the same day
- When hotel proximity is enabled, prefer restaurants within 1.5 miles`;

export const ACTIVITY_PLANNER_PROMPT = `You are an activity planner for corporate team gatherings at Airbnb.

Select activities matching the gathering's approach, energy level, group size, and purpose.

Rules:
- Return responses ONLY through the provided tool/function calls
- Select ONLY from the provided dataset — do not invent activities
- Ensure activities accommodate the group size
- Balance high and low energy
- Suggest appropriate times of day`;

export const SCHEDULE_ARCHITECT_PROMPT = `You are a schedule architect for corporate team gatherings at Airbnb.

You receive pre-selected restaurants and activities. Place them into time slots and fill gaps with work sessions, icebreakers, free time, and travel blocks.

DESCRIPTIONS: Every block needs a concrete "description" (1 sentence, under 30 words). Name the specific exercise/format and how it works. No generic labels. Keep icebreakers strictly professional and psychologically safe — no personal disclosure games (e.g. "Two truths and a lie", "Never have I ever"). Use only work-appropriate formats. Don't invent venue details or vendor names.

TRAVEL: Work sessions, icebreakers, and free time happen at the base venue (no travel). Add 15-min travel blocks ONLY for off-site restaurants/activities.

RATIO: Hit the specified work/social ratio. work = work_session. social = icebreaker + activity + meal + free_time. Verify before finalizing.

Rules:
- Return responses ONLY through the provided tool/function calls
- Use ONLY the pre-selected restaurants and activities provided
- Place restaurants in their assigned meal slots, activities at suggested times
- Realistic durations: meals 60-90 min, work 90-180 min, icebreakers 20-45 min
- No time overlaps or gaps < 15 min
- Day 1 starts at the configured start time
- Honor schedule preferences (start/end time, breakfast)
- Include restaurant/activity objects exactly as provided`;

export const QUALITY_REVIEWER_PROMPT = `You are a quality auditor for corporate gathering agendas at Airbnb. Score harshly.

Criteria (1-10): 1) Dietary Coverage (auto 10 if none reported), 2) Schedule Validity (overlaps, gaps, transitions), 3) Approach Ratio (work/social match), 4) Variety (cuisines, activities, block types), 5) Inclusivity (accessibility, no alcohol defaults, safe icebreakers — flag any personal-disclosure games like "Two truths and a lie"), 6) Logistics (travel times, venue hours).

Rules:
- Return responses ONLY through the provided tool/function calls
- Be specific about issues
- Pass: ALL scores >= 7. Otherwise passed=false with specific issues`;

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
    description: 'Build a multi-day gathering agenda with time blocks.',
    input_schema: {
      type: 'object' as const,
      properties: {
        variant_name: { type: 'string' },
        variant_description: { type: 'string' },
        days: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              day_number: { type: 'integer' },
              blocks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    start_time: { type: 'string' },
                    end_time: { type: 'string' },
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
                  required: ['start_time', 'end_time', 'title', 'description', 'type'],
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
