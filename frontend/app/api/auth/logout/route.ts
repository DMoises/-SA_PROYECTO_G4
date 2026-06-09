import { NextResponse } from 'next/server'
import { GATEWAY_URL, SESSION_COOKIE } from '@/lib/gateway'

export async function POST() {
  try {
    await fetch(`${GATEWAY_URL}/auth/logout`, { method: 'POST' })
  } catch {
  }

  const response = NextResponse.json({ ok: true })
  const expired = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  }
  response.cookies.set(SESSION_COOKIE, '', expired)
  response.cookies.set('qt_user_id', '', expired) 
  return response
}
