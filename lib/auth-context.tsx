"use client"

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

// ======== CONFIG DE PERMISOS =========

// Todos los módulos del sistema
type Modulo = 
  | "dashboard"
  | "productos"
  | "inventario"
  | "ventas"
  | "reportes"
  | "usuarios"
  | "configuracion"

// Acciones posibles
type Accion = "ver" | "crear" | "editar" | "eliminar" | "anular"

type Rol = "admin" | "cajero" | "inventario"

type PermisosPorRol = Record<Rol, Record<Modulo, Accion[]>>

// Configura aquí lo que cada rol puede hacer:
const PERMISOS_ROL: PermisosPorRol = {
  admin: {
    dashboard: ["ver"],
    productos: ["ver", "crear", "editar", "eliminar"],
    inventario: ["ver", "crear", "editar", "eliminar"],
    ventas: ["ver", "crear", "editar", "anular"],
    reportes: ["ver"],
    usuarios: ["ver", "crear", "editar", "eliminar"],
    configuracion: ["ver", "editar"]
  },
  cajero: {
    dashboard: ["ver"],
    ventas: ["ver", "crear"],
    productos: ["ver"],       // Solo puede VER productos
    reportes: ["ver"],        // Solo puede VER reportes
    inventario: [],
    usuarios: [],
    configuracion: [],
  },
  inventario: {
    dashboard: ["ver"],
    inventario: ["ver", "crear", "editar"],
    productos: ["ver"],
    ventas: [],
    usuarios: [],
    reportes: [],
    configuracion: [],
  }
}

// ========= TIPOS DE CONTEXTO Y USUARIO ==========

type User = {
  id: number
  nombre: string
  email: string
  rol: Rol
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  tienePermiso: (modulo: Modulo, accion: Accion) => boolean
}

const STORAGE_KEY = 'supermercado_auth'
const AuthContext = createContext<AuthContextType | null>(null)

// ========= EL PROVIDER ==========

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      setUser(JSON.parse(stored))
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  // AJUSTA esta función según tu backend real
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setIsAuthenticated(true)
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data.user))
        setIsLoading(false)
        return true
      } else {
        setUser(null)
        setIsAuthenticated(false)
        setIsLoading(false)
        return false
      }
    } catch {
      setUser(null)
      setIsAuthenticated(false)
      setIsLoading(false)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    setIsLoading(false)
    sessionStorage.removeItem(STORAGE_KEY)
    router.push("/")
  }

  // ======== PERMISOS =========
  const tienePermiso = (modulo: Modulo, accion: Accion): boolean => {
    if (!user) return false
    const permisosModulo = PERMISOS_ROL[user.rol]?.[modulo]
    return Array.isArray(permisosModulo) && permisosModulo.includes(accion)
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoading, login, logout, tienePermiso }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ========= HOOK DE USO =========

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}