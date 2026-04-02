import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-helpers'
import { updateAgendaBlock, deleteAgendaBlock } from '@/lib/db/agenda'

/**
 * PUT /api/gatherings/[id]/agenda/[blockId]
 * Updates a single agenda block.
 * Requires MANAGER or ADMIN role.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; blockId: string }> }
) {
  const { error } = await requireRole(['MANAGER', 'ADMIN'])
  if (error) return error

  const { blockId } = await params

  try {
    const body = await request.json()
    const block = await updateAgendaBlock(blockId, body)
    return NextResponse.json(block)
  } catch (err) {
    console.error('Failed to update agenda block:', err)
    return NextResponse.json(
      { error: 'Failed to update agenda block' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/gatherings/[id]/agenda/[blockId]
 * Deletes a single agenda block.
 * Requires MANAGER or ADMIN role.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; blockId: string }> }
) {
  const { error } = await requireRole(['MANAGER', 'ADMIN'])
  if (error) return error

  const { blockId } = await params

  try {
    await deleteAgendaBlock(blockId)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('Failed to delete agenda block:', err)
    return NextResponse.json(
      { error: 'Failed to delete agenda block' },
      { status: 500 }
    )
  }
}
