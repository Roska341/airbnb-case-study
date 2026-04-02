import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  // Simulate API latency
  await new Promise((r) => setTimeout(r, 300))

  try {
    const body = await request.json()
    const { listingId, checkIn, checkOut, guests } = body

    if (!listingId || !checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'Missing required fields: listingId, checkIn, checkOut' },
        { status: 400 }
      )
    }

    const bookingId = `BK-${crypto.randomUUID().slice(0, 8)}`
    const confirmationCode = `AIR-${crypto.randomUUID().slice(0, 8)}`

    return NextResponse.json({
      bookingId,
      status: 'confirmed',
      listingId,
      checkIn,
      checkOut,
      guests: guests || 1,
      confirmationCode,
    })
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
