import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = request.nextUrl

  // Allow auth-related routes and login page through
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/airbnb') || pathname.startsWith('/api/swag') || pathname.startsWith('/api/passkey')) {
    return NextResponse.next()
  }

  // Allow unauthenticated access to login page
  if (pathname === '/login') {
    // If already authenticated, redirect to dashboard
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // Redirect unauthenticated users to login for all other routes
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all routes except static files, images, and API auth routes
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
}
