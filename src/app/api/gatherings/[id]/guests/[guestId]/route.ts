import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-helpers'
import { removeGuest } from '@/lib/db/invitations'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; guestId: string }> }
) {
  const { error } = await requireRole(['MANAGER', 'ADMIN'])
  if (error) return error

  const { guestId } = await params

  const guest = await prisma.invitation.findUnique({ where: { id: guestId } })
  if (!guest) {
    return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
  }
  if (guest.status !== 'NOT_INVITED') {
    return NextResponse.json(
      { error: 'Can only remove guests who have not been invited yet' },
      { status: 400 }
    )
  }

  await removeGuest(guestId)
  return NextResponse.json({ success: true })
}
