import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import {
  getGatheringById,
  updateGathering,
  deleteGathering,
} from '@/lib/db/gatherings'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuth()
  if (error) return error

  const { id } = await params
  const gathering = await getGatheringById(id)

  if (!gathering) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // EMPLOYEE can only view gatherings they are invited to
  if (session!.user.role === 'EMPLOYEE') {
    const invitation = await prisma.invitation.findFirst({
      where: {
        gatheringId: id,
        employeeId: session!.user.id,
      },
    })
    if (!invitation) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  return NextResponse.json(gathering)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuth()
  if (error) return error

  const { id } = await params
  const existing = await getGatheringById(id)

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Only the creator (MANAGER) or ADMIN can update
  if (
    session!.user.role !== 'ADMIN' &&
    existing.createdById !== session!.user.id
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()

  // Convert date strings to Date objects if present
  if (body.startDate) body.startDate = new Date(body.startDate)
  if (body.endDate) body.endDate = new Date(body.endDate)

  const updated = await updateGathering(id, body)
  return NextResponse.json(updated)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuth()
  if (error) return error

  const { id } = await params
  const existing = await getGatheringById(id)

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Only the creator (MANAGER) or ADMIN can delete
  if (
    session!.user.role !== 'ADMIN' &&
    existing.createdById !== session!.user.id
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await deleteGathering(id)
  return NextResponse.json({ success: true })
}
