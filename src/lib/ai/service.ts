/**
 * AI Service
 *
 * Shared utilities and single-shot AI functions:
 *
 * 1. loadCityData — load restaurant/activity datasets for a city
 * 2. getRecommendations — gathering format recommendations (wizard step 4)
 * 3. suggestBlock — single block suggestion for "AI Suggest" button
 *
 * Full agenda generation is handled by the orchestrator (./orchestrator.ts)
 * which coordinates 4 specialist agents.
 */

import fs from 'fs';
import path from 'path';
import { anthropic } from './client';
import { SYSTEM_PROMPT, tools } from './prompts';
import type { Message } from '@anthropic-ai/sdk/resources/messages';
import type {
  GatheringContext,
  Recommendation,
  AgendaBlockSuggestion,
  BlockContext,
} from './types';

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 4096;

// ── Restaurant / Activity data types ──────────────────────────────

interface RestaurantData {
  name: string;
  cuisine: string;
  rating: number;
  price: string;
  dietary: string[];
  distance: string;
  reason: string;
}

interface ActivityData {
  name: string;
  venue: string;
  duration: string;
  capacity: string;
  type: string;
  reason: string;
}

// ── City data loader ──────────────────────────────────────────────

/**
 * Extract a city key from a location string and load the corresponding
 * restaurant and activity JSON datasets.
 *
 * Supports: Austin, SF, NYC, Seattle.
 * Falls back to Austin if the city is unrecognized.
 */
export function loadCityData(location: string): {
  restaurants: RestaurantData[];
  activities: ActivityData[];
} {
  const cityMap: Record<string, string> = {
    austin: 'austin',
    sf: 'sf',
    'san francisco': 'sf',
    nyc: 'nyc',
    'new york': 'nyc',
    'new york city': 'nyc',
    seattle: 'seattle',
  };

  const normalized = location.toLowerCase().trim();
  let cityKey = 'austin'; // default fallback

  for (const [pattern, key] of Object.entries(cityMap)) {
    if (normalized.includes(pattern)) {
      cityKey = key;
      break;
    }
  }

  const dataDir = path.resolve(process.cwd(), 'src/data/mock');

  let restaurants: RestaurantData[] = [];
  let activities: ActivityData[] = [];

  try {
    const restaurantPath = path.join(dataDir, `${cityKey}-restaurants.json`);
    restaurants = JSON.parse(fs.readFileSync(restaurantPath, 'utf-8'));
  } catch {
    // Silently fall back to empty array — the AI will still generate blocks,
    // just without restaurant grounding data.
  }

  try {
    const activityPath = path.join(dataDir, `${cityKey}-activities.json`);
    activities = JSON.parse(fs.readFileSync(activityPath, 'utf-8'));
  } catch {
    // Same fallback as above.
  }

  return { restaurants, activities };
}

// ── Helper: extract tool_use result from Claude response ──────────

function extractToolInput<T>(
  response: Message,
  toolName: string,
): T {
  const toolBlock = response.content.find(
    (block) => block.type === 'tool_use' && block.name === toolName,
  );

  if (!toolBlock || toolBlock.type !== 'tool_use') {
    throw new Error(
      `AI response did not contain expected tool call "${toolName}". ` +
        `Response had ${response.content.length} content block(s): ` +
        response.content.map((b) => b.type).join(', '),
    );
  }

  // The input field is already a parsed object — no JSON.parse needed
  return toolBlock.input as T;
}

// ── 1. Gathering Recommendations ──────────────────────────────────

/**
 * Generate gathering format recommendations based on wizard inputs.
 * Used in the CreateGathering wizard Step 4 ("AI Recommendations").
 */
export async function getRecommendations(
  context: GatheringContext,
): Promise<Recommendation> {
  const userPrompt = `Generate gathering recommendations for the following:

Gathering type: ${context.type}
${context.purpose ? `Purpose: ${context.purpose}` : ''}
${context.teamContext ? `Team context: ${context.teamContext}` : ''}
Group size: ${context.groupSize} people
Duration: ${context.duration} day${context.duration !== 1 ? 's' : ''}
Location: ${context.location}
${context.dietarySummary ? `Dietary considerations: ${context.dietarySummary}` : ''}

Based on this information, recommend the best gathering format, explain your rationale, list expected outcomes, flag any risks, and suggest an ideal duration.`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    stream: false,
    system: SYSTEM_PROMPT,
    tools: tools.filter((t) => t.name === 'generate_recommendations'),
    tool_choice: { type: 'tool', name: 'generate_recommendations' },
    messages: [{ role: 'user', content: userPrompt }],
  });

  const result = extractToolInput<{
    format: string;
    rationale: string;
    outcomes: string[];
    riskFlags: string[];
    suggestedDuration: string;
  }>(response, 'generate_recommendations');

  return {
    format: result.format,
    rationale: result.rationale,
    outcomes: result.outcomes,
    riskFlags: result.riskFlags,
    suggestedDuration: result.suggestedDuration,
  };
}

// ── 2. Single Block Suggestion ────────────────────────────────────

interface RawBlockSuggestion {
  start_time: string;
  end_time: string;
  title: string;
  description?: string;
  type: string;
  restaurant?: AgendaBlockSuggestion['restaurant'];
  activity?: AgendaBlockSuggestion['activity'];
}

/**
 * Suggest a single agenda block for a specific time slot.
 * Used by the "AI Suggest" button in the agenda editor.
 */
export async function suggestBlock(
  context: BlockContext,
  restaurants: RestaurantData[],
  activities: ActivityData[],
): Promise<AgendaBlockSuggestion> {
  const userPrompt = `Suggest a single agenda block for this time slot:

Gathering type: ${context.gatheringType}
${context.purpose ? `Purpose: ${context.purpose}` : ''}
Location: ${context.location}
Group size: ${context.groupSize} people
Time slot: ${context.timeSlot}
Desired block type: ${context.blockType}
${context.existingBlocks ? `Other blocks in the agenda:\n${context.existingBlocks}` : ''}

${context.blockType === 'meal' ? `AVAILABLE RESTAURANTS (select ONLY from this list):\n${JSON.stringify(restaurants, null, 2)}` : ''}
${context.blockType === 'activity' ? `AVAILABLE ACTIVITIES (select ONLY from this list):\n${JSON.stringify(activities, null, 2)}` : ''}

Generate a single block suggestion. Set start_time and end_time to match the time slot "${context.timeSlot}".
${context.blockType === 'meal' ? 'Include a restaurant object from the provided list.' : ''}
${context.blockType === 'activity' ? 'Include an activity object from the provided list.' : ''}`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    stream: false,
    system: SYSTEM_PROMPT,
    tools: tools.filter((t) => t.name === 'suggest_block'),
    tool_choice: { type: 'tool', name: 'suggest_block' },
    messages: [{ role: 'user', content: userPrompt }],
  });

  const raw = extractToolInput<RawBlockSuggestion>(response, 'suggest_block');

  return {
    startTime: raw.start_time,
    endTime: raw.end_time,
    title: raw.title,
    description: raw.description,
    type: raw.type,
    restaurant: raw.restaurant,
    activity: raw.activity,
  };
}

