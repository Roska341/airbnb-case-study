import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import {
  getRegistrations,
  createRegistration,
  getRegistrationStats,
} from '@/lib/db/registrations'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const [registrations, stats] = await Promise.all([
    getRegistrations(id),
    getRegistrationStats(id),
  ])

  return NextResponse.json({ registrations, stats })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuth()
  if (error) return error

  const { id } = await params
  const body = await request.json()

  const { dietaryRestrictions, tshirtSize, travelOriginCity, needsLodging, additionalNotes, customResponses } = body

  const registration = await createRegistration({
    gatheringId: id,
    userId: session!.user.id,
    invitationId: body.invitationId,
    dietaryRestrictions,
    accessibilityNeeds: body.accessibilityNeeds,
    travelOriginCity,
    tshirtSize,
    additionalNotes,
    needsLodging,
    customResponses,
  })

  return NextResponse.json({ registration }, { status: 201 })
}
