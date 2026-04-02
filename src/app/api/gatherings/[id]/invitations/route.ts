import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { getInvitations } from '@/lib/db/invitations'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const invitations = await getInvitations(id)

  const stats = {
    total: invitations.length,
    notInvited: invitations.filter((i) => i.status === 'NOT_INVITED').length,
    accepted: invitations.filter((i) => i.status === 'ACCEPTED').length,
    pending: invitations.filter((i) => i.status === 'PENDING').length,
    declined: invitations.filter((i) => i.status === 'DECLINED').length,
  }

  return NextResponse.json({ invitations, stats })
}
