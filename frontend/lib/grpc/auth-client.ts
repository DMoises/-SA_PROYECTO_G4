import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import path from 'path'

const PROTO_PATH = path.join(process.cwd(), 'proto', 'auth.proto')

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: Number,
  enums: String,
  defaults: true,
  oneofs: true,
})

const proto = grpc.loadPackageDefinition(packageDefinition) as any

const AUTH_SERVICE_URL = process.env.GRPC_AUTH_URL || 'localhost:50051'

let client: any = null

function getClient() {
  if (!client) {
    client = new proto.auth.v1.AuthService(
      AUTH_SERVICE_URL,
      grpc.credentials.createInsecure()
    )
  }
  return client
}

function promisify<T>(fn: Function, request: any): Promise<T> {
  return new Promise((resolve, reject) => {
    fn.call(getClient(), request, (err: grpc.ServiceError | null, response: T) => {
      if (err) reject(err)
      else resolve(response)
    })
  })
}

// --- Tipos ---

export interface RegistrarRequest {
  email: string
  password: string
  nombrePerfil: string
}

export interface RegistrarResponse {
  usuarioId: string
  perfilId: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  usuarioId: string
  expiraEn: number
}

export interface ValidarTokenRequest {
  token: string
}

export interface ValidarTokenResponse {
  valido: boolean
  usuarioId: string
  rol: string
}

export interface CrearPerfilRequest {
  usuarioId: string
  nombre: string
  esInfantil: boolean
  idioma: string
}

export interface PerfilResponse {
  id: string
  nombre: string
  esInfantil: boolean
  idioma: string
}

export interface ListarPerfilesResponse {
  perfiles: PerfilResponse[]
}

// --- Funciones del cliente ---

export async function registrar(req: RegistrarRequest): Promise<RegistrarResponse> {
  return promisify<RegistrarResponse>(getClient().registrar, {
    email: req.email,
    password: req.password,
    nombrePerfil: req.nombrePerfil,
  })
}

export async function login(req: LoginRequest): Promise<LoginResponse> {
  return promisify<LoginResponse>(getClient().login, {
    email: req.email,
    password: req.password,
  })
}

export async function validarToken(token: string): Promise<ValidarTokenResponse> {
  return promisify<ValidarTokenResponse>(getClient().validarToken, { token })
}

export async function crearPerfil(req: CrearPerfilRequest): Promise<PerfilResponse> {
  return promisify<PerfilResponse>(getClient().crearPerfil, {
    usuarioId: req.usuarioId,
    nombre: req.nombre,
    esInfantil: req.esInfantil,
    idioma: req.idioma,
  })
}

export async function listarPerfiles(usuarioId: string): Promise<ListarPerfilesResponse> {
  return promisify<ListarPerfilesResponse>(getClient().listarPerfiles, {
    usuarioId: usuarioId,
  })
}
