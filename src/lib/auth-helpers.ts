import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

/**
 * Require authentication for an API route handler.
 * Returns the session if authenticated, or a 401 JSON response if not.
 */
export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      session: null,
    }
  }
  return { error: null, session }
}

/**
 * Require one of the specified roles for an API route handler.
 * Returns the session if authorized, a 401 if not authenticated,
 * or a 403 if the user's role is not in the allowed list.
 */
export async function requireRole(allowedRoles: string[]) {
  const { error, session } = await requireAuth()
  if (error) return { error, session: null }

  if (!allowedRoles.includes(session!.user.role)) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      session: null,
    }
  }
  return { error: null, session: session! }
}

/**
 * Get the current authenticated user from the session.
 * Returns null if not authenticated (no error thrown).
 */
export async function getCurrentUser() {
  const session = await auth()
  return session?.user ?? null
}
