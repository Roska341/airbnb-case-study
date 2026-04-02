import { anthropic } from '../client';
import { RESTAURANT_CURATOR_PROMPT, specialistTools } from '../prompts';
import type { Message } from '@anthropic-ai/sdk/resources/messages';
import type { GatheringContext, CuratedMeals } from '../types';
import type { AgendaConfiguration, PriceRange } from '../agenda-config';
import { getApproachById } from '../agenda-config';

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 4096;

interface RestaurantData {
  name: string;
  cuisine: string;
  rating: number;
  price: string;
  dietary: string[];
  distance: string;
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

export async function restaurantCurator(
  context: GatheringContext,
  restaurants: RestaurantData[],
  config: AgendaConfiguration,
): Promise<CuratedMeals> {
  const approach = getApproachById(config.approachId);

  // Pre-filter by price range (soft filter — falls back to full list)
  let filtered = [...restaurants];
  if (config.food.priceRange.length > 0) {
    const priceFiltered = filtered.filter((r) =>
      config.food.priceRange.includes(r.price as PriceRange),
    );
    if (priceFiltered.length > 0) filtered = priceFiltered;
  }

  const mealsPerDay = config.schedule.includeBreakfast
    ? ['breakfast', 'lunch', 'dinner']
    : ['lunch', 'dinner'];

  const mealSlots = Array.from({ length: context.duration }, (_, i) =>
    mealsPerDay.map((meal) => `day${i + 1}_${meal}`)
  ).flat();

  const userPrompt = `Select restaurants for a ${context.duration}-day ${context.type} gathering.

Group size: ${context.groupSize} people
Location: ${context.location}
${context.dietarySummary ? `Dietary needs: ${context.dietarySummary}` : 'No specific dietary needs reported.'}

Approach: "${approach.name}" — ${approach.aiInstruction}

Preferences:
- Cuisine: ${config.food.cuisinePreferences.length > 0 ? config.food.cuisinePreferences.join(', ') : 'any'}
- Price range: ${config.food.priceRange.length > 0 ? config.food.priceRange.join(', ') : 'any'}
- Dining style: ${config.food.diningStyle.length > 0 ? config.food.diningStyle.join(', ') : 'any'}
${config.proximity.prioritizeNearHotel ? `- Hotel proximity: Prefer restaurants within 1.5 miles of ${config.proximity.accommodationAddress ?? 'the hotel'}` : ''}

Meal slots to fill: ${mealSlots.join(', ')}

AVAILABLE RESTAURANTS (select ONLY from this list):
${JSON.stringify(filtered, null, 2)}

Select one restaurant per meal slot. Vary cuisines across meals. Explain each selection.`;

  const tool = specialistTools.curate_restaurants;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    stream: false,
    system: RESTAURANT_CURATOR_PROMPT,
    tools: [tool],
    tool_choice: { type: 'tool', name: 'curate_restaurants' },
    messages: [{ role: 'user', content: userPrompt }],
  });

  return extractToolInput<CuratedMeals>(response, 'curate_restaurants');
}
