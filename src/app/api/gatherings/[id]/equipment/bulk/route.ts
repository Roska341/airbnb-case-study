import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-helpers'
import {
  bulkCreateEquipmentItems,
  deleteAllEquipmentItems,
  getEquipmentItems,
} from '@/lib/db/equipment'
import { updateModuleStatus } from '@/lib/db/gatherings'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole(['MANAGER', 'ADMIN'])
  if (error) return error

  const { id } = await params
  const { items, replaceExisting } = await request.json()

  if (replaceExisting) {
    await deleteAllEquipmentItems(id)
  }

  await bulkCreateEquipmentItems(
    items.map((item: Record<string, unknown>, idx: number) => ({
      gatheringId: id,
      ...item,
      sortOrder: item.sortOrder ?? idx,
    }))
  )

  await updateModuleStatus(id, 'equipment', 'in_progress')

  const saved = await getEquipmentItems(id)
  return NextResponse.json(saved)
}
