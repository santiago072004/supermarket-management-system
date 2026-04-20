import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // DEBUG: muestra TODOS los usuarios en consola
    const users = await query<any[]>("SELECT * FROM usuarios")
    console.log("USUARIOS EN LA BASE REAL:")
    users.forEach(u => console.log(u))

    // Resto igual
    const usuarios = await query(
      "SELECT id, nombre, email, password, rol FROM usuarios WHERE email = ? AND activo = 1 LIMIT 1",
      [email]
    ) as any[]

    console.log("LOGIN:", { email, password })
    if (usuarios.length === 0) {
      console.log("NO ENCONTRADO O INACTIVO")
      return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 })
    }
    const user = usuarios[0]
    console.log("HASH EN BD:", user.password)
    const match = await bcrypt.compare(password, user.password)
    console.log("¿MATCH?", match)
    if (!match) {
      return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 })
    }
    return NextResponse.json({
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      }
    })
  } catch (error) {
    console.error("Error en login:", error)
    return NextResponse.json({ error: "Error de autenticación" }, { status: 500 })
  }
}