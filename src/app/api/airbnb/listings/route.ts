import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

function normalizeCityKey(city: string): string {
  const normalized = city.toLowerCase().trim()
  if (normalized.includes('san francisco') || normalized === 'sf') return 'sf'
  if (normalized.includes('new york') || normalized === 'nyc') return 'nyc'
  if (normalized.includes('seattle')) return 'seattle'
  if (normalized.includes('austin')) return 'austin'
  return 'austin' // fallback
}

interface Listing {
  id: string
  title: string
  price: number
  rating: number
  reviews: number
  guests: number
  bedrooms: number
  amenities: string[]
  image: string
  distance: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get('city') || 'austin'
  const guests = searchParams.get('guests')
  const maxPrice = searchParams.get('maxPrice')

  // Simulate API latency
  await new Promise((r) => setTimeout(r, 200))

  const cityKey = normalizeCityKey(city)
  const filePath = path.resolve(
    process.cwd(),
    'src/data/mock',
    `${cityKey}-listings.json`
  )

  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    let listings: Listing[] = JSON.parse(raw)

    if (guests) {
      const minGuests = parseInt(guests, 10)
      if (!isNaN(minGuests)) {
        listings = listings.filter((l) => l.guests >= minGuests)
      }
    }

    if (maxPrice) {
      const max = parseFloat(maxPrice)
      if (!isNaN(max)) {
        listings = listings.filter((l) => l.price <= max)
      }
    }

    return NextResponse.json(listings)
  } catch {
    // If file not found, try austin as fallback
    try {
      const fallbackPath = path.resolve(
        process.cwd(),
        'src/data/mock',
        'austin-listings.json'
      )
      const raw = fs.readFileSync(fallbackPath, 'utf-8')
      const listings: Listing[] = JSON.parse(raw)
      return NextResponse.json(listings)
    } catch {
      return NextResponse.json([], { status: 200 })
    }
  }
}
