import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-helpers'
import { getGatheringById } from '@/lib/db/gatherings'
import { getRecommendations } from '@/lib/ai/service'
import type { GatheringContext } from '@/lib/ai/types'

export async function POST(request: Request) {
  const { error } = await requireRole(['MANAGER'])
  if (error) return error

  const body = await request.json()

  let context: GatheringContext

  if (body.gatheringId) {
    const gathering = await getGatheringById(body.gatheringId)
    if (!gathering) {
      return NextResponse.json({ error: 'Gathering not found' }, { status: 404 })
    }

    const startDate = new Date(gathering.startDate)
    const endDate = new Date(gathering.endDate)
    const duration =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1

    context = {
      type: gathering.type,
      purpose: gathering.purpose ?? undefined,
      teamContext: gathering.teamContext ?? undefined,
      groupSize: gathering.groupSize,
      duration,
      location: gathering.location,
    }
  } else {
    context = {
      type: body.type,
      purpose: body.purpose,
      teamContext: body.teamContext,
      groupSize: body.groupSize,
      duration: body.duration,
      location: body.location,
    }
  }

  try {
    const recommendation = await getRecommendations(context)
    return NextResponse.json(recommendation)
  } catch {
    return NextResponse.json(
      { error: 'Failed to generate recommendations. Please try again.' },
      { status: 500 }
    )
  }
}
