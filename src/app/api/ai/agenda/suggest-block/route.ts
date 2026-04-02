import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-helpers'
import { getGatheringById } from '@/lib/db/gatherings'
import { suggestBlock, loadCityData } from '@/lib/ai/service'
import type { BlockContext } from '@/lib/ai/types'

export async function POST(request: Request) {
  const { error } = await requireRole(['MANAGER'])
  if (error) return error

  const body = await request.json()
  const { gatheringId, timeSlot, blockType, existingBlocks } = body

  if (!gatheringId || !timeSlot || !blockType) {
    return NextResponse.json(
      { error: 'gatheringId, timeSlot, and blockType are required' },
      { status: 400 }
    )
  }

  const gathering = await getGatheringById(gatheringId)
  if (!gathering) {
    return NextResponse.json(
      { error: 'Gathering not found' },
      { status: 404 }
    )
  }

  const { restaurants, activities } = loadCityData(gathering.location)

  const context: BlockContext = {
    gatheringType: gathering.type,
    purpose: gathering.purpose ?? undefined,
    location: gathering.location,
    groupSize: gathering.groupSize,
    timeSlot,
    blockType,
    existingBlocks,
  }

  try {
    const suggestion = await suggestBlock(context, restaurants, activities)
    return NextResponse.json(suggestion)
  } catch {
    return NextResponse.json(
      { error: 'Failed to suggest block. Please try again.' },
      { status: 500 }
    )
  }
}
