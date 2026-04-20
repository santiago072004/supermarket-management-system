import { NextRequest, NextResponse } from 'next/server'
import { query, run } from '@/lib/db'

// GET /api/ventas?limit=50&fechaInicio=yyyy-mm-dd&fechaFin=yyyy-mm-dd&estado=completada
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')
    const estado = searchParams.get('estado')
    const limit = searchParams.get('limit')

    let sql = `
      SELECT 
        v.*,
        u.nombre as usuario_nombre
      FROM ventas v
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      WHERE 1=1
    `
    const params: (string | number)[] = []

    if (fechaInicio) {
      sql += ` AND DATE(v.created_at) >= DATE(?)`
      params.push(fechaInicio)
    }

    if (fechaFin) {
      sql += ` AND DATE(v.created_at) <= DATE(?)`
      params.push(fechaFin)
    }

    if (estado) {
      sql += ` AND v.estado = ?`
      params.push(estado)
    }

    sql += ` ORDER BY v.created_at DESC`
    if (limit) {
      sql += ` LIMIT ?`
      params.push(parseInt(limit))
    }

    const ventas = await query(sql, params)
    return NextResponse.json({ ventas })
  } catch (error) {
    console.error('Error al obtener ventas:', error)
    return NextResponse.json(
      { error: 'Error al obtener ventas' },
      { status: 500 }
    )
  }
}

// INTERFAZ
interface ItemVenta {
  producto_id: number
  cantidad: number
  precio_unitario: number
  descuento?: number
}

// POST /api/ventas
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { items, metodo_pago, monto_recibido, usuario_id, cliente_nombre, notas } = data as {
      items: ItemVenta[]
      metodo_pago: string
      monto_recibido?: number
      usuario_id?: number
      cliente_nombre?: string
      notas?: string
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No hay productos en la venta' }, { status: 400 })
    }

    // STOCK disponible: valida primero
    for (const item of items) {
      const resStock = await query('SELECT stock_actual, nombre FROM productos WHERE id = ?', [item.producto_id])
      if (!resStock.length || resStock[0].stock_actual < item.cantidad) {
        return NextResponse.json(
          { error: `No hay suficiente stock de ${resStock[0]?.nombre || 'producto id: ' + item.producto_id}` },
          { status: 400 }
        )
      }
    }

    // Totales
    let subtotal = 0, descuento_total = 0
    for (const item of items) {
      subtotal += item.precio_unitario * item.cantidad
      descuento_total += item.descuento || 0
    }
    const total = subtotal - descuento_total
    const cambio = monto_recibido ? monto_recibido - total : 0

    // Generación de numero_venta ÚNICO (soporta multi-venta por día)
    let numero_venta = '', consecutivo = 1, reintentos = 3
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const fechaFolio = `${yyyy}${mm}${dd}`

    while (reintentos-- > 0) {
      // Busca el mayor folio del día
      const rows = await query(
        "SELECT numero_venta FROM ventas WHERE numero_venta LIKE ? ORDER BY numero_venta DESC LIMIT 1",
        [`V${fechaFolio}%`]
      )
      consecutivo = 1
      if (rows.length > 0) {
        consecutivo = parseInt(rows[0].numero_venta.slice(-4), 10) + 1
      }
      numero_venta = `V${fechaFolio}${String(consecutivo).padStart(4, "0")}`

      try {
        // INSERTA venta
        await run(
          `INSERT INTO ventas 
            (numero_venta, usuario_id, cliente_nombre, subtotal, descuento, impuesto, total, 
             metodo_pago, monto_recibido, cambio, estado, notas, created_at)
           VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, 'completada', ?, DATETIME('now', 'localtime'))`,
          [
            numero_venta,
            usuario_id || null,
            cliente_nombre || null,
            subtotal,
            descuento_total,
            total,
            metodo_pago,
            monto_recibido || null,
            cambio > 0 ? cambio : null,
            notas || null,
          ]
        )
        break // ¡Éxito, no hay colisión!
      } catch (error: any) {
        if (
          error.code === "SQLITE_CONSTRAINT" &&
          error.message?.includes("ventas.numero_venta")
        ) {
          // Si colisión, espera y reintenta con siguiente folio
          await new Promise(res => setTimeout(res, 20))
          continue
        }
        throw error // Otros errores son fatales
      }
    }

    // Obtener ID insertado
    const [{ id: venta_id }] = await query('SELECT last_insert_rowid() as id')

    // Insertar detalles y actualizar stock
    for (const item of items) {
      const itemSubtotal = item.precio_unitario * item.cantidad
      const itemDescuento = item.descuento || 0
      await run(
        `INSERT INTO detalle_ventas 
          (venta_id, producto_id, cantidad, precio_unitario, descuento, subtotal, created_at)
         VALUES (?, ?, ?, ?, ?, ?, DATETIME('now', 'localtime'))`,
        [venta_id, item.producto_id, item.cantidad, item.precio_unitario, itemDescuento, itemSubtotal - itemDescuento]
      )

      // Actualiza stock
      const stockArr = await query<{ stock_actual: number }[]>(
        'SELECT stock_actual FROM productos WHERE id = ?', [item.producto_id])
      if (stockArr.length > 0) {
        const stock_anterior = stockArr[0].stock_actual
        const stock_nuevo = stock_anterior - item.cantidad
        await run(
          'UPDATE productos SET stock_actual = ? WHERE id = ?',
          [stock_nuevo, item.producto_id]
        )
        await run(
          `INSERT INTO movimientos_inventario 
            (producto_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo, usuario_id, created_at)
           VALUES (?, 'salida', ?, ?, ?, ?, ?, DATETIME('now', 'localtime'))`,
          [item.producto_id, item.cantidad, stock_anterior, stock_nuevo, `Venta #${numero_venta}`, usuario_id || null]
        )
      }
    }

    // Respuesta final
    return NextResponse.json({
      success: true,
      id: venta_id,
      numero_venta,
      total,
      cambio: cambio > 0 ? cambio : 0,
      message: "Venta registrada exitosamente"
    })
  } catch (error: any) {
    console.error("Error al registrar venta:", error)
    return NextResponse.json(
      { error: "Error al registrar venta", details: error?.message },
      { status: 500 }
    )
  }
}