import { NextRequest, NextResponse } from 'next/server'
import { registrar } from '@/lib/grpc/auth-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, nombre_perfil } = body

    if (!email || !password || !nombre_perfil) {
      return NextResponse.json(
        { error: 'Email, contraseña y nombre de perfil son obligatorios' },
        { status: 400 }
      )
    }

    const result = await registrar({ email, password, nombrePerfil: nombre_perfil })

    return NextResponse.json({
      usuario_id: result.usuarioId,
      perfil_id: result.perfilId,
    }, { status: 201 })
  } catch (err: any) {
    const code = err?.code
    // gRPC code 6 = AlreadyExists
    if (code === 6) {
      return NextResponse.json({ error: 'Este correo ya esta registrado' }, { status: 409 })
    }
    // gRPC code 3 = InvalidArgument
    if (code === 3) {
      return NextResponse.json({ error: err.details || 'Datos invalidos' }, { status: 400 })
    }
    console.error('Error en registro:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
