import { NextRequest, NextResponse } from 'next/server'
import { validarToken } from '@/lib/grpc/auth-client'

const TOKEN_COOKIE = 'qt_token'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(TOKEN_COOKIE)?.value

    if (!token) {
      return NextResponse.json({ valido: false }, { status: 401 })
    }

    const result = await validarToken(token)

    if (!result.valido) {
      return NextResponse.json({ valido: false }, { status: 401 })
    }

    return NextResponse.json({
      valido: true,
      usuario_id: result.usuarioId,
      rol: result.rol,
    })
  } catch (err: any) {
    console.error('Error validando token:', err)
    return NextResponse.json({ valido: false }, { status: 401 })
  }
}
