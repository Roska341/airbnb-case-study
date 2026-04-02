import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { respondToInvitation } from '@/lib/db/invitations'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; invId: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  const { invId } = await params
  const body = await request.json()
  const { status } = body as { status: 'ACCEPTED' | 'DECLINED' }

  if (!status || !['ACCEPTED', 'DECLINED'].includes(status)) {
    return NextResponse.json(
      { error: 'status must be ACCEPTED or DECLINED' },
      { status: 400 }
    )
  }

  const invitation = await respondToInvitation(invId, status)

  return NextResponse.json({ invitation })
}
