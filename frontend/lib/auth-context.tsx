'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

interface AuthUser {
  usuario_id: string
  rol: string
  email: string
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ ok: boolean; rol?: string; error?: string }>
  register: (email: string, password: string, nombrePerfil: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<AuthUser | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        if (data.usuario_id) {
          const u: AuthUser = { usuario_id: data.usuario_id, rol: data.rol, email: data.email || '' }
          setUser(u)
          return u
        }
      }
      setUser(null)
      return null
    } catch {
      setUser(null)
      return null
    }
  }, [])

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loginFn = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        return { ok: false, error: data.error || 'Error al iniciar sesion' }
      }

      const u = await refreshUser()
      return { ok: true, rol: u?.rol }
    } catch {
      return { ok: false, error: 'Error de conexion' }
    }
  }

  const registerFn = async (email: string, password: string, nombrePerfil: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nombre_perfil: nombrePerfil }),
      })
      const data = await res.json()

      if (!res.ok) {
        return { ok: false, error: data.error || 'Error al registrarse' }
      }

      // Auto-login despues del registro
      const loginResult = await loginFn(email, password)
      return loginResult
    } catch {
      return { ok: false, error: 'Error de conexion' }
    }
  }

  const logoutFn = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login: loginFn,
        register: registerFn,
        logout: logoutFn,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}
