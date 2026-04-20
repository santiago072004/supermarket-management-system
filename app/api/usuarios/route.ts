import { NextRequest, NextResponse } from 'next/server'
import { query, run } from '@/lib/db'
import bcrypt from 'bcryptjs'

// ========== GET: Lista usuarios ==========
export async function GET() {
  try {
    const usuarios = await query(
      `SELECT id, nombre, email, rol, activo, ultimo_acceso, created_at
       FROM usuarios 
       ORDER BY nombre ASC`
    )
    return NextResponse.json(usuarios)
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 })
  }
}

// ========== POST: Crear usuario ==========
export async function POST(request: NextRequest) {
  try {
    const { nombre, email, password, rol } = await request.json()

    // Checa si el email ya existe
    const existente = await query(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    )
    if (existente.length > 0) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 })
    }

    const hash = await bcrypt.hash(password, 10)

    await run(
      `INSERT INTO usuarios (nombre, email, password, rol, activo)
       VALUES (?, ?, ?, ?, 1)`,
      [nombre, email, hash, rol || 'cajero']
    )

    // Obtener el último id insertado
    const [{ id }] = await query('SELECT last_insert_rowid() as id')

    return NextResponse.json({ 
      success: true, 
      id,
      message: 'Usuario creado exitosamente' 
    })
  } catch (error) {
    console.error('Error al crear usuario:', error)
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
  }
}

// ========== PATCH: Activar/Desactivar usuario ==========
export async function PATCH(request: NextRequest) {
  try {
    const { id, activo } = await request.json()
    if (typeof id !== 'number' || (activo !== 1 && activo !== 0)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    await run(
      'UPDATE usuarios SET activo = ? WHERE id = ?',
      [activo, id]
    )

    return NextResponse.json({ 
      success: true,
      id, 
      activo,
      message: `Usuario ${activo ? "activado" : "desactivado"} exitosamente` 
    })
  } catch (error) {
    console.error('Error al cambiar estado de usuario:', error)
    return NextResponse.json({ error: 'Error al cambiar estado de usuario' }, { status: 500 })
  }
}