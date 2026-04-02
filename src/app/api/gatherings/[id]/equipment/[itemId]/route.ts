import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-helpers'
import { updateEquipmentItem, deleteEquipmentItem } from '@/lib/db/equipment'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { error } = await requireRole(['MANAGER', 'ADMIN'])
  if (error) return error

  const { itemId } = await params
  const body = await request.json()

  const item = await updateEquipmentItem(itemId, body)
  return NextResponse.json(item)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { error } = await requireRole(['MANAGER', 'ADMIN'])
  if (error) return error

  const { itemId } = await params
  await deleteEquipmentItem(itemId)
  return new NextResponse(null, { status: 204 })
}
