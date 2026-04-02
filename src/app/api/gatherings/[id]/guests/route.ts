import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-helpers'
import { getInvitations, addGuest } from '@/lib/db/invitations'
import { updateModuleStatus } from '@/lib/db/gatherings'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole(['MANAGER', 'ADMIN'])
  if (error) return error

  const { id } = await params
  const guests = await getInvitations(id)

  const stats = {
    total: guests.length,
    notInvited: guests.filter((g) => g.status === 'NOT_INVITED').length,
    pending: guests.filter((g) => g.status === 'PENDING').length,
    accepted: guests.filter((g) => g.status === 'ACCEPTED').length,
    declined: guests.filter((g) => g.status === 'DECLINED').length,
  }

  return NextResponse.json({ guests, stats })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole(['MANAGER', 'ADMIN'])
  if (error) return error

  const { id } = await params
  const body = await request.json()
  const { name, email } = body as { name: string; email: string }

  if (!name || !email) {
    return NextResponse.json(
      { error: 'name and email are required' },
      { status: 400 }
    )
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: 'Invalid email address' },
      { status: 400 }
    )
  }

  try {
    const guest = await addGuest({ gatheringId: id, guestName: name, guestEmail: email })
    await updateModuleStatus(id, 'invitations', 'in_progress')
    return NextResponse.json({ guest }, { status: 201 })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
      return NextResponse.json(
        { error: 'This email is already on the guest list' },
        { status: 409 }
      )
    }
    throw err
  }
}
