import { NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth-helpers'
import { getGatherings, createGathering } from '@/lib/db/gatherings'

export async function GET() {
  const { error, session } = await requireAuth()
  if (error) return error

  const gatherings = await getGatherings({
    userId: session!.user.id,
    role: session!.user.role,
  })

  return NextResponse.json(gatherings)
}

export async function POST(request: Request) {
  const { error, session } = await requireRole(['MANAGER'])
  if (error) return error

  const body = await request.json()
  const gathering = await createGathering({
    ...body,
    createdById: session.user.id,
    startDate: new Date(body.startDate),
    endDate: new Date(body.endDate),
  })

  return NextResponse.json(gathering, { status: 201 })
}
