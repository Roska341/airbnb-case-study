import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  // Simulate API latency
  await new Promise((r) => setTimeout(r, 400))

  try {
    const body = await request.json()
    const { amount, currency, description, userId } = body

    if (amount === undefined || amount === null) {
      return NextResponse.json(
        { error: 'Missing required field: amount' },
        { status: 400 }
      )
    }

    const transactionId = `PK-${crypto.randomUUID().slice(0, 8)}`

    return NextResponse.json({
      transactionId,
      status: 'completed',
      amount: parseFloat(amount),
      currency: currency || 'USD',
      description: description || null,
      userId: userId || null,
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
