import { NextRequest, NextResponse } from 'next/server'
import { query, run } from '@/lib/db'
import bcrypt from 'bcryptjs'

// GET
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params //  FIX

    const usuarios = await query(
      `SELECT id, nombre, email, rol, activo, ultimo_acceso, created_at
       FROM usuarios WHERE id = ?`,
      [id]
    )

    if (!usuarios || usuarios.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(usuarios[0])
  } catch (error) {
    console.error('Error al obtener usuario:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuario' },
      { status: 500 }
    )
  }
}

// PUT
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params //  FIX
    const data = await request.json()

    const { nombre, email, password, rol, activo } = data as {
      nombre?: string
      email?: string
      password?: string
      rol?: string
      activo?: boolean
    }

    const updates: string[] = []
    const values: (string | number)[] = []

    if (nombre !== undefined) {
      updates.push('nombre = ?')
      values.push(nombre)
    }

    if (email !== undefined) {
      updates.push('email = ?')
      values.push(email)
    }

    if (password && password.trim() !== "") {
      const hash = await bcrypt.hash(password, 10)
      updates.push('password = ?')
      values.push(hash)
    }

    if (rol !== undefined) {
      updates.push('rol = ?')
      values.push(rol)
    }

    if (activo !== undefined) {
      updates.push('activo = ?')
      values.push(activo ? 1 : 0)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No hay datos para actualizar' },
        { status: 400 }
      )
    }

    values.push(Number(id))

    await run(
      `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`,
      values
    )

    return NextResponse.json({
      success: true,
      message: 'Usuario actualizado exitosamente'
    })

  } catch (error) {
    console.error('Error al actualizar usuario:', error)
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}

// DELETE 
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params //  FIX CLAVE

    console.log(' Eliminando usuario ID:', id)

    const { changes } = await run(
      'DELETE FROM usuarios WHERE id = ?',
      [id]
    )

    console.log('Filas eliminadas:', changes)

    if (changes === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado correctamente'
    })

  } catch (error) {
    console.error('Error al eliminar usuario:', error)
    return NextResponse.json(
      { error: 'Error al eliminar usuario' },
      { status: 500 }
    )
  }
}