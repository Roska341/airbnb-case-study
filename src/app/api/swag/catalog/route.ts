import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface SwagItem {
  id: string
  name: string
  price: number
  sizes: string[] | null
  image: string
  category: string
  description: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')

  // Simulate API latency
  await new Promise((r) => setTimeout(r, 150))

  try {
    const filePath = path.resolve(
      process.cwd(),
      'src/data/mock',
      'swag-catalog.json'
    )
    const raw = fs.readFileSync(filePath, 'utf-8')
    let items: SwagItem[] = JSON.parse(raw)

    if (category) {
      items = items.filter(
        (item) => item.category.toLowerCase() === category.toLowerCase()
      )
    }

    return NextResponse.json(items)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
