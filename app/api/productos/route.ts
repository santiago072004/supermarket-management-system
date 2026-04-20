// /app/api/productos/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { query, run } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const categoria = searchParams.get('categoria')
    const stockBajo = searchParams.get('stockBajo')

    let sql = `
      SELECT 
        p.*,
        c.nombre as categoria_nombre,
        c.color as categoria_color,
        pr.nombre as proveedor_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
      WHERE p.activo = 1
    `
    const params: (string | number)[] = []

    if (search) {
      sql += ` AND (p.nombre LIKE ? OR p.codigo_barras LIKE ? OR p.descripcion LIKE ?)`
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }

    if (categoria) {
      sql += ` AND p.categoria_id = ?`
      params.push(parseInt(categoria))
    }

    if (stockBajo === 'true') {
      sql += ` AND p.stock_actual <= p.stock_minimo`
    }

    sql += ` ORDER BY p.nombre ASC`

    const productos = await query(sql, params)

    return NextResponse.json({ productos })
  } catch (error) {
    console.error('Error al obtener productos:', error)
    return NextResponse.json(
      { error: 'Error al obtener productos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    await run(
      `INSERT INTO productos 
        (codigo_barras, nombre, descripcion, categoria_id, proveedor_id, 
         precio_compra, precio_venta, stock_actual, stock_minimo, unidad, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        data.codigo_barras || null,
        data.nombre,
        data.descripcion || null,
        data.categoria_id || null,
        data.proveedor_id || null,
        data.precio_compra,
        data.precio_venta,
        data.stock_actual || 0,
        data.stock_minimo || 0,
        data.unidad || 'unidad',
      ]
    )

    // SQLite: obtener el último ID autoincrementado insertado
    const [{ id }] = await query('SELECT last_insert_rowid() AS id')

    return NextResponse.json({ 
      success: true, 
      id,
      message: 'Producto creado exitosamente' 
    })
  } catch (error) {
    console.error('Error al crear producto:', error)
    return NextResponse.json(
      { error: 'Error al crear producto' },
      { status: 500 }
    )
  }
}