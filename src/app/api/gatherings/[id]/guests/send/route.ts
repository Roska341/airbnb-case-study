import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-helpers'
import { sendInvitations, sendAllNotInvited } from '@/lib/db/invitations'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole(['MANAGER', 'ADMIN'])
  if (error) return error

  const { id } = await params
  const body = await request.json()
  const { guestIds, sendAll } = body as { guestIds?: string[]; sendAll?: boolean }

  if (sendAll) {
    const updated = await sendAllNotInvited(id)
    return NextResponse.json({ sent: updated.length })
  }

  if (!guestIds || !Array.isArray(guestIds) || guestIds.length === 0) {
    return NextResponse.json(
      { error: 'guestIds must be a non-empty array, or set sendAll: true' },
      { status: 400 }
    )
  }

  const updated = await sendInvitations(guestIds)
  return NextResponse.json({ sent: updated.length })
}
