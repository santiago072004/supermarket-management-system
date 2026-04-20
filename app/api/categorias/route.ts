import { NextRequest, NextResponse } from 'next/server'
import { query, run } from '@/lib/db'

// GET: Listar categorías con total de productos activos en cada una
export async function GET() {
  try {
    const categorias = await query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM productos p WHERE p.categoria_id = c.id AND p.activo = 1) as total_productos
       FROM categorias c 
       WHERE c.activa = 1 
       ORDER BY c.nombre ASC`
    )

    return NextResponse.json(categorias)
  } catch (error) {
    console.error('Error al obtener categorías:', error)
    return NextResponse.json(
      { error: 'Error al obtener categorías' },
      { status: 500 }
    )
  }
}

// POST: Crear nueva categoría
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    await run(
      `INSERT INTO categorias (nombre, descripcion, color, activa)
       VALUES (?, ?, ?, 1)`,
      [data.nombre, data.descripcion || null, data.color || '#6366f1']
    );

    // Obtener el último ID insertado en SQLite
    const [{ id }] = await query('SELECT last_insert_rowid() as id');

    return NextResponse.json({ 
      success: true, 
      id,
      message: 'Categoría creada exitosamente' 
    });
  } catch (error) {
    console.error('Error al crear categoría:', error)
    return NextResponse.json(
      { error: 'Error al crear categoría' },
      { status: 500 }
    );
  }
}