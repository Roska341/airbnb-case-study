import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/db/notifications'

export async function GET() {
  const { error, session } = await requireAuth()
  if (error) return error

  const notifications = await getNotifications(session!.user.id)

  return NextResponse.json({ notifications })
}

export async function PUT(request: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  const body = await request.json()
  const { notificationId, markAll } = body as {
    notificationId?: string
    markAll?: boolean
  }

  if (markAll) {
    await markAllNotificationsRead(session!.user.id)
    return NextResponse.json({ success: true, message: 'All notifications marked as read' })
  }

  if (!notificationId) {
    return NextResponse.json(
      { error: 'notificationId is required when markAll is not true' },
      { status: 400 }
    )
  }

  await markNotificationRead(notificationId)
  return NextResponse.json({ success: true })
}
