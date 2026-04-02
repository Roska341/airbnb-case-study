import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { getAccommodations, createAccommodation } from '@/lib/db/accommodation'
import { updateModuleStatus } from '@/lib/db/gatherings'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const accommodations = await getAccommodations(id)

  return NextResponse.json({ accommodations })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuth()
  if (error) return error

  const { id } = await params
  const body = await request.json()

  const accommodation = await createAccommodation({
    gatheringId: id,
    bookedById: session!.user.id,
    title: body.title,
    address: body.address,
    pricePerNight: body.pricePerNight,
    checkIn: new Date(body.checkIn),
    checkOut: new Date(body.checkOut),
    airbnbListingId: body.airbnbListingId,
    imageUrl: body.imageUrl,
    bookedForId: body.bookedForId,
    passkeyConfirmation: body.passkeyConfirmation,
    bookingType: body.bookingType,
  })
  await updateModuleStatus(id, 'accommodation', 'in_progress')

  return NextResponse.json({ accommodation }, { status: 201 })
}
