import { NextRequest, NextResponse } from 'next/server'
import { query, run } from '@/lib/db'

// ========== GET: Listar proveedores ==========
export async function GET() {
  try {
    const proveedores = await query(
      `SELECT pr.*, 
        (SELECT COUNT(*) FROM productos p WHERE p.proveedor_id = pr.id AND p.activo = 1) as total_productos
       FROM proveedores pr 
       WHERE pr.activo = 1 
       ORDER BY pr.nombre ASC`
    )
    return NextResponse.json(proveedores)
  } catch (error) {
    console.error('Error al obtener proveedores:', error)
    return NextResponse.json(
      { error: 'Error al obtener proveedores' },
      { status: 500 }
    )
  }
}

// ========== POST: Crear proveedor ==========
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    await run(
      `INSERT INTO proveedores (nombre, contacto, telefono, email, direccion, activo)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [
        data.nombre,
        data.contacto || null,
        data.telefono || null,
        data.email || null,
        data.direccion || null,
      ]
    )

    // Obtener el ID autoincrement generado para el nuevo proveedor
    const [{ id }] = await query('SELECT last_insert_rowid() as id')

    return NextResponse.json({ 
      success: true, 
      id,
      message: 'Proveedor creado exitosamente' 
    })
  } catch (error) {
    console.error('Error al crear proveedor:', error)
    return NextResponse.json(
      { error: 'Error al crear proveedor' },
      { status: 500 }
    )
  }
}