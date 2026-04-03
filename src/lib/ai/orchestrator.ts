import { restaurantCurator } from './specialists/restaurant-curator';
import { activityPlanner } from './specialists/activity-planner';
import { scheduleArchitect } from './specialists/schedule-architect';
import { qualityReviewer } from './specialists/quality-reviewer';
import type {
  GatheringContext,
  ProgressEvent,
  OrchestratedResult,
} from './types';
import type { AgendaConfiguration } from './agenda-config';

const MAX_REFINEMENTS = 2;

interface CityData {
  restaurants: { name: string; cuisine: string; rating: number; price: string; dietary: string[]; distance: string; reason: string }[];
  activities: { name: string; venue: string; duration: string; capacity: string; type: string; reason: string }[];
}

export async function* generateAgendaOrchestrated(
  context: GatheringContext,
  cityData: CityData,
  config: AgendaConfiguration,
): AsyncGenerator<ProgressEvent> {
  // ── Phase 1: Parallel curation ───────────────
  yield { phase: 'curating', step: 'Curating restaurants & activities...' };

  // Determine if external restaurant curation is needed
  const hasExternalMeals = (() => {
    const mealsPerDay = [
      ...(config.schedule.includeBreakfast && !config.food.venueBreakfast ? ['breakfast'] : []),
      'lunch',
      ...(!config.food.venueDinner ? ['dinner'] : []),
    ];
    return mealsPerDay.length > 0;
  })();

  const [meals, activities] = await Promise.all([
    hasExternalMeals
      ? restaurantCurator(context, cityData.restaurants, config)
      : Promise.resolve({ picks: [], reasoning: 'All meals at venue — no external restaurants needed.', dietaryGaps: [] } as import('./types').CuratedMeals),
    activityPlanner(context, cityData.activities, config),
  ]);

  yield {
    phase: 'curating',
    step: `Found ${meals.picks.length} restaurants and ${activities.picks.length} activities`,
    data: { mealsCount: meals.picks.length, activitiesCount: activities.picks.length },
  };

  // ── Phase 2: Schedule assembly ───────────────
  yield { phase: 'scheduling', step: 'Building your schedule...' };

  let agenda = await scheduleArchitect(context, meals, activities, config);

  yield { phase: 'scheduling', step: 'Schedule assembled' };

  // ── Phase 3: Quality gate ────────────────────
  yield { phase: 'reviewing', step: 'Running quality review...' };

  for (let i = 0; i < MAX_REFINEMENTS; i++) {
    const review = await qualityReviewer(agenda, context, config);

    if (review.passed) {
      yield {
        phase: 'complete',
        step: `Quality approved (${review.overallScore.toFixed(1)}/10)`,
        result: { agenda, quality: review, meals, activities, refinements: i },
      };
      return;
    }

    // Not the last iteration — refine
    if (i < MAX_REFINEMENTS - 1) {
      yield {
        phase: 'reviewing',
        step: `Refining: ${review.issues[0] ?? 'improving quality'}...`,
      };

      agenda = await scheduleArchitect(context, meals, activities, config, {
        feedback: review.issues,
        previous: agenda,
      });
    } else {
      // Last iteration — return best effort with the review
      yield {
        phase: 'complete',
        step: `Agenda ready (${review.overallScore.toFixed(1)}/10)`,
        result: { agenda, quality: review, meals, activities, refinements: i + 1 },
      };
      return;
    }
  }

  // Fallback (shouldn't reach here, but TypeScript needs it)
  yield {
    phase: 'complete',
    step: 'Agenda ready',
    result: { agenda, quality: null, meals, activities, refinements: MAX_REFINEMENTS },
  };
}
