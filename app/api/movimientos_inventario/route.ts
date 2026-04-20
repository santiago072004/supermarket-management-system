// /app/api/movimientos_inventario/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { query, run } from '@/lib/db'

// === OBTENER MOVIMIENTOS REALES ===
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const movimientos = await query(
      `
      SELECT
        mi.id,
        mi.producto_id,
        p.nombre AS producto_nombre,
        mi.tipo,
        mi.cantidad,
        mi.stock_anterior,
        mi.stock_nuevo,
        mi.motivo,
        mi.created_at
      FROM movimientos_inventario mi
      LEFT JOIN productos p ON mi.producto_id = p.id
      ORDER BY mi.created_at DESC
      LIMIT ?
      `,
      [limit]
    )

    return NextResponse.json({ movimientos })
  } catch (error) {
    console.error('Error obteniendo movimientos:', error)
    return NextResponse.json({ error: 'Error al obtener movimientos' }, { status: 500 })
  }
}

// === REGISTRAR NUEVO MOVIMIENTO Y AJUSTE DE STOCK ===
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { producto_id, tipo, cantidad, motivo } = data

    // 1. Verifica producto y stock actual
    const stockResult = await query<{ stock_actual: number }[]>(
      'SELECT stock_actual FROM productos WHERE id = ?',
      [producto_id]
    )

    if (!stockResult || stockResult.length === 0) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    const stock_anterior = stockResult[0].stock_actual
    let stock_nuevo: number

    if (tipo === 'entrada') stock_nuevo = stock_anterior + cantidad
    else if (tipo === 'salida') stock_nuevo = Math.max(0, stock_anterior - cantidad)
    else if (tipo === 'ajuste') stock_nuevo = cantidad
    else return NextResponse.json({ error: 'Tipo no válido' }, { status: 400 })

    // 2. Actualiza el stock real
    await run(
      'UPDATE productos SET stock_actual = ? WHERE id = ?',
      [stock_nuevo, producto_id]
    )

    // 3. Registra el movimiento (fecha SQLite)
    await run(
      `INSERT INTO movimientos_inventario
        (producto_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo, created_at)
       VALUES (?, ?, ?, ?, ?, ?, DATETIME('now', 'localtime'))`,
      [
        producto_id,
        tipo,
        cantidad,
        stock_anterior,
        stock_nuevo,
        motivo || null,
      ]
    )

    // Obtener el id insertado
    const [{ id }] = await query('SELECT last_insert_rowid() as id')

    return NextResponse.json({
      success: true,
      id,
      stock_anterior,
      stock_nuevo,
      message: 'Movimiento registrado exitosamente',
    })
  } catch (error) {
    console.error('Error al registrar movimiento:', error)
    return NextResponse.json({ error: 'Error al registrar movimiento' }, { status: 500 })
  }
}