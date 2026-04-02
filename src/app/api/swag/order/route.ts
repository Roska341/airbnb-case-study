import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  // Simulate API latency
  await new Promise((r) => setTimeout(r, 500))

  try {
    const body = await request.json()
    const { items, totalCost } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: items (non-empty array)' },
        { status: 400 }
      )
    }

    const orderId = `SO-${crypto.randomUUID().slice(0, 8)}`

    return NextResponse.json({
      orderId,
      status: 'confirmed',
      items,
      totalCost: totalCost || 0,
      estimatedDelivery: '5-7 business days',
    })
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
