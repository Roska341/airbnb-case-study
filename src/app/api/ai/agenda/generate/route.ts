import { requireRole } from '@/lib/auth-helpers';
import { getGatheringById } from '@/lib/db/gatherings';
import { getRegistrationStats } from '@/lib/db/registrations';
import { getAccommodations } from '@/lib/db/accommodation';
import { loadCityData } from '@/lib/ai/service';
import { generateAgendaOrchestrated } from '@/lib/ai/orchestrator';
import type { GatheringContext } from '@/lib/ai/types';
import type { AgendaConfiguration } from '@/lib/ai/agenda-config';

function buildDietarySummary(
  dietaryBreakdown: Record<string, number>,
): string | undefined {
  const entries = Object.entries(dietaryBreakdown);
  if (entries.length === 0) return undefined;
  return entries.map(([restriction, count]) => `${count} ${restriction}`).join(', ');
}

export async function POST(request: Request) {
  const { error } = await requireRole(['MANAGER']);
  if (error) return error;

  const body = await request.json();
  const { gatheringId, configuration } = body as {
    gatheringId: string;
    configuration: AgendaConfiguration;
  };

  if (!gatheringId) {
    return new Response(JSON.stringify({ error: 'gatheringId required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!configuration) {
    return new Response(JSON.stringify({ error: 'configuration required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const gathering = await getGatheringById(gatheringId);
  if (!gathering) {
    return new Response(JSON.stringify({ error: 'Gathering not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const stats = await getRegistrationStats(gatheringId);
  const dietarySummary = buildDietarySummary(stats.dietaryBreakdown);

  const startDate = new Date(gathering.startDate);
  const endDate = new Date(gathering.endDate);
  const duration =
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const cityData = loadCityData(gathering.location);

  // Fetch accommodation for base venue info and proximity
  const accommodations = await getAccommodations(gatheringId);
  let venueAddress: string | undefined;

  if (accommodations.length > 0 && accommodations[0].address) {
    venueAddress = accommodations[0].address;
    if (configuration.proximity.prioritizeNearHotel) {
      configuration.proximity.accommodationAddress = accommodations[0].address;
    }
  }

  const context: GatheringContext = {
    type: gathering.type,
    purpose: gathering.purpose ?? undefined,
    teamContext: gathering.teamContext ?? undefined,
    groupSize: gathering.groupSize,
    duration,
    location: gathering.location,
    dietarySummary,
    venueAddress,
  };

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of generateAgendaOrchestrated(context, cityData, configuration)) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        const errorEvent = { phase: 'error', step: 'Generation failed', message };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
