import { NextRequest, NextResponse } from 'next/server'
import { query, run } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productoId = searchParams.get('producto_id')
    const tipo = searchParams.get('tipo')
    const limit = searchParams.get('limit')

    let sql = `
      SELECT 
        mi.*,
        p.nombre as producto_nombre,
        p.codigo_barras,
        u.nombre as usuario_nombre
      FROM movimientos_inventario mi
      LEFT JOIN productos p ON mi.producto_id = p.id
      LEFT JOIN usuarios u ON mi.usuario_id = u.id
      WHERE 1=1
    `
    const params: (string | number)[] = []

    if (productoId) {
      sql += ` AND mi.producto_id = ?`
      params.push(parseInt(productoId))
    }

    if (tipo) {
      sql += ` AND mi.tipo = ?`
      params.push(tipo)
    }

    sql += ` ORDER BY mi.created_at DESC`

    if (limit) {
      sql += ` LIMIT ?`
      params.push(parseInt(limit))
    }

    const movimientos = await query(sql, params)

    return NextResponse.json(movimientos)
  } catch (error) {
    console.error('Error al obtener movimientos:', error)
    return NextResponse.json(
      { error: 'Error al obtener movimientos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { producto_id, tipo, cantidad, motivo, usuario_id } = data as {
      producto_id: number
      tipo: 'entrada' | 'salida' | 'ajuste'
      cantidad: number
      motivo?: string
      usuario_id?: number
    }

    // Obtener stock actual
    const stockResult = await query<{ stock_actual: number }[]>(
      'SELECT stock_actual FROM productos WHERE id = ?',
      [producto_id]
    )

    if (!Array.isArray(stockResult) || stockResult.length === 0) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    const stock_anterior = stockResult[0].stock_actual
    let stock_nuevo: number

    switch (tipo) {
      case 'entrada':
        stock_nuevo = stock_anterior + cantidad
        break
      case 'salida':
        stock_nuevo = Math.max(0, stock_anterior - cantidad)
        break
      case 'ajuste':
        stock_nuevo = cantidad
        break
      default:
        return NextResponse.json(
          { error: 'Tipo de movimiento inválido' },
          { status: 400 }
        )
    }

    // Actualizar stock de productos
    await run(
      'UPDATE productos SET stock_actual = ? WHERE id = ?',
      [stock_nuevo, producto_id]
    )

    // Registrar movimiento en la tabla movimientos_inventario
    await run(
      `INSERT INTO movimientos_inventario 
        (producto_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [producto_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo || null, usuario_id || null]
    )

    // Obtener el ID del último insertado
    const [{ id }] = await query('SELECT last_insert_rowid() as id')

    return NextResponse.json({
      success: true,
      id,
      stock_anterior,
      stock_nuevo,
      message: 'Movimiento registrado exitosamente'
    })
  } catch (error) {
    console.error('Error al registrar movimiento:', error)
    return NextResponse.json(
      { error: 'Error al registrar movimiento' },
      { status: 500 }
    )
  }
}