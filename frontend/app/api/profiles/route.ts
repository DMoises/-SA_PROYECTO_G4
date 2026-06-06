import { NextRequest, NextResponse } from 'next/server'
import { listarPerfiles, crearPerfil } from '@/lib/grpc/auth-client'
import { validarToken } from '@/lib/grpc/auth-client'

const TOKEN_COOKIE = 'qt_token'

async function getUsuarioId(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(TOKEN_COOKIE)?.value
  if (!token) return null

  try {
    const result = await validarToken(token)
    if (!result.valido) return null
    return result.usuarioId
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const usuarioId = await getUsuarioId(request)
    if (!usuarioId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const result = await listarPerfiles(usuarioId)

    return NextResponse.json({ perfiles: result.perfiles || [] })
  } catch (err: any) {
    console.error('Error listando perfiles:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const usuarioId = await getUsuarioId(request)
    if (!usuarioId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { nombre, es_infantil = false, idioma = 'es' } = body

    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre del perfil es obligatorio' },
        { status: 400 }
      )
    }

    const perfil = await crearPerfil({
      usuarioId,
      nombre,
      esInfantil: es_infantil,
      idioma,
    })

    return NextResponse.json(perfil, { status: 201 })
  } catch (err: any) {
    const code = err?.code
    // gRPC code 9 = FailedPrecondition (limite de perfiles)
    if (code === 9) {
      return NextResponse.json(
        { error: 'Has alcanzado el limite maximo de 5 perfiles' },
        { status: 400 }
      )
    }
    console.error('Error creando perfil:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
