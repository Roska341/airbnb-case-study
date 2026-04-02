import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth-helpers'
import { getSwagOrders, createSwagOrder } from '@/lib/db/swag-orders'
import { updateModuleStatus } from '@/lib/db/gatherings'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const orders = await getSwagOrders(id)

  return NextResponse.json({ orders })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireRole(['MANAGER', 'ADMIN'])
  if (error) return error

  const { id } = await params
  const body = await request.json()
  const { items, totalCost } = body as { items: string; totalCost: number }

  if (!items || totalCost == null) {
    return NextResponse.json(
      { error: 'items and totalCost are required' },
      { status: 400 }
    )
  }

  const order = await createSwagOrder({
    gatheringId: id,
    orderedById: session.user.id,
    items,
    totalCost,
  })
  await updateModuleStatus(id, 'swag', 'in_progress')

  return NextResponse.json({ order }, { status: 201 })
}
