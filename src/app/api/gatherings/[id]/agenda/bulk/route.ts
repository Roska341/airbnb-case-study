import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-helpers'
import {
  bulkCreateAgendaBlocks,
  deleteAllAgendaBlocks,
} from '@/lib/db/agenda'
import { updateModuleStatus } from '@/lib/db/gatherings'

/**
 * POST /api/gatherings/[id]/agenda/bulk
 * Bulk-creates agenda blocks for a gathering (from AI generation or variant selection).
 * If replaceExisting is true, deletes all existing blocks first.
 * Requires MANAGER or ADMIN role.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole(['MANAGER', 'ADMIN'])
  if (error) return error

  const { id } = await params

  try {
    const body = await request.json()
    const { blocks, replaceExisting } = body as {
      blocks: Array<{
        day: number
        startTime: string
        endTime: string
        title: string
        description?: string
        type: string
        aiGenerated?: boolean
        variant?: string
        restaurantData?: string
        activityData?: string
        sortOrder?: number
      }>
      replaceExisting?: boolean
    }

    if (!Array.isArray(blocks)) {
      return NextResponse.json(
        { error: 'blocks must be an array' },
        { status: 400 }
      )
    }

    if (replaceExisting) {
      await deleteAllAgendaBlocks(id)
    }

    const created = await bulkCreateAgendaBlocks(
      blocks.map((b) => ({ gatheringId: id, ...b }))
    )

    await updateModuleStatus(id, 'agenda', 'in_progress')

    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    console.error('Failed to bulk create agenda blocks:', err)
    return NextResponse.json(
      { error: 'Failed to bulk create agenda blocks' },
      { status: 500 }
    )
  }
}
