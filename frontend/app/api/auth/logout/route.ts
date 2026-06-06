import { NextResponse } from 'next/server'

const TOKEN_COOKIE = 'qt_token'
const USERID_COOKIE = 'qt_user_id'

export async function POST() {
  const response = NextResponse.json({ ok: true })

  response.cookies.set(TOKEN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  response.cookies.set(USERID_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  return response
}
