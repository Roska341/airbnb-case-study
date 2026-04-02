import { NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth-helpers'
import { getAgendaBlocks, createAgendaBlock } from '@/lib/db/agenda'
import { updateModuleStatus } from '@/lib/db/gatherings'

/**
 * GET /api/gatherings/[id]/agenda
 * Returns all agenda blocks for a gathering, sorted by day and sortOrder.
 * Requires authentication.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  const { id } = await params

  try {
    const blocks = await getAgendaBlocks(id)
    return NextResponse.json(blocks)
  } catch (err) {
    console.error('Failed to fetch agenda blocks:', err)
    return NextResponse.json(
      { error: 'Failed to fetch agenda blocks' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/gatherings/[id]/agenda
 * Creates a single agenda block for a gathering.
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

    const block = await createAgendaBlock({
      gatheringId: id,
      ...body,
    })

    await updateModuleStatus(id, 'agenda', 'in_progress')

    return NextResponse.json(block, { status: 201 })
  } catch (err) {
    console.error('Failed to create agenda block:', err)
    return NextResponse.json(
      { error: 'Failed to create agenda block' },
      { status: 500 }
    )
  }
}
