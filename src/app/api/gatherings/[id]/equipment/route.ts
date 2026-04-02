import { NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth-helpers'
import { getEquipmentItems, createEquipmentItem } from '@/lib/db/equipment'
import { updateModuleStatus } from '@/lib/db/gatherings'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const items = await getEquipmentItems(id)
  return NextResponse.json(items)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole(['MANAGER', 'ADMIN'])
  if (error) return error

  const { id } = await params
  const body = await request.json()

  const item = await createEquipmentItem({
    gatheringId: id,
    ...body,
  })

  await updateModuleStatus(id, 'equipment', 'in_progress')

  return NextResponse.json(item, { status: 201 })
}
