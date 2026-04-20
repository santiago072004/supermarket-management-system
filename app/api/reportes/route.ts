import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') || 'ventas'
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')

    let resultado

    switch (tipo) {
      case 'ventas':
        resultado = await getReporteVentas(fechaInicio, fechaFin)
        break
      case 'productos':
        resultado = await getReporteProductos(fechaInicio, fechaFin)
        break
      case 'categorias':
        resultado = await getReporteCategorias(fechaInicio, fechaFin)
        break
      case 'inventario':
        resultado = await getReporteInventario()
        break
      default:
        return NextResponse.json(
          { error: 'Tipo de reporte inválido' },
          { status: 400 }
        )
    }

    return NextResponse.json(resultado)
  } catch (error) {
    console.error('Error al generar reporte:', error)
    return NextResponse.json(
      { error: 'Error al generar reporte' },
      { status: 500 }
    )
  }
}

async function getReporteVentas(fechaInicio: string | null, fechaFin: string | null) {
  let whereClause = "WHERE v.estado = 'completada'"
  const params: string[] = []

  if (fechaInicio) {
    whereClause += ' AND DATE(v.created_at) >= ?'
    params.push(fechaInicio)
  }
  if (fechaFin) {
    whereClause += ' AND DATE(v.created_at) <= ?'
    params.push(fechaFin)
  }

  // Resumen general
  const resumen = await query(
    `SELECT 
      COUNT(*) as total_ventas,
      COALESCE(SUM(total), 0) as total_ingresos,
      COALESCE(AVG(total), 0) as ticket_promedio,
      COALESCE(MAX(total), 0) as venta_mayor,
      COALESCE(MIN(total), 0) as venta_menor
     FROM ventas v
     ${whereClause}`,
    params
  )

  // Ventas por día
  const ventasPorDia = await query(
    `SELECT 
      DATE(v.created_at) as fecha,
      COUNT(*) as total_ventas,
      COALESCE(SUM(total), 0) as total_ingresos
     FROM ventas v
     ${whereClause}
     GROUP BY DATE(v.created_at)
     ORDER BY fecha ASC`,
    params
  )

  // Ventas por método de pago
  const ventasPorMetodo = await query(
    `SELECT 
      metodo_pago,
      COUNT(*) as total_ventas,
      COALESCE(SUM(total), 0) as total_ingresos
     FROM ventas v
     ${whereClause}
     GROUP BY metodo_pago`,
    params
  )

  // Ventas por hora CORREGIDO para SQLite
  const ventasPorHora = await query(
    `SELECT 
      strftime('%H', v.created_at) as hora,
      COUNT(*) as total_ventas,
      COALESCE(SUM(total), 0) as total_ingresos
     FROM ventas v
     ${whereClause}
     GROUP BY strftime('%H', v.created_at)
     ORDER BY hora ASC`,
    params
  )

  return {
    resumen: Array.isArray(resumen) ? resumen[0] : resumen,
    ventasPorDia,
    ventasPorMetodo,
    ventasPorHora,
  }
}

async function getReporteProductos(fechaInicio: string | null, fechaFin: string | null) {
  let whereClause = "WHERE v.estado = 'completada'"
  const params: string[] = []

  if (fechaInicio) {
    whereClause += ' AND DATE(v.created_at) >= ?'
    params.push(fechaInicio)
  }
  if (fechaFin) {
    whereClause += ' AND DATE(v.created_at) <= ?'
    params.push(fechaFin)
  }

  // Productos más vendidos
  const masVendidos = await query(
    `SELECT 
      p.id,
      p.codigo_barras,
      p.nombre,
      c.nombre as categoria,
      SUM(dv.cantidad) as total_vendido,
      SUM(dv.subtotal) as total_ingresos,
      COUNT(DISTINCT v.id) as total_transacciones
     FROM detalle_ventas dv
     JOIN productos p ON dv.producto_id = p.id
     JOIN ventas v ON dv.venta_id = v.id
     LEFT JOIN categorias c ON p.categoria_id = c.id
     ${whereClause}
     GROUP BY p.id, p.codigo_barras, p.nombre, c.nombre
     ORDER BY total_vendido DESC
     LIMIT 20`,
    params
  )

  // Productos menos vendidos
  const menosVendidos = await query(
    `SELECT 
      p.id,
      p.codigo_barras,
      p.nombre,
      c.nombre as categoria,
      COALESCE(SUM(dv.cantidad), 0) as total_vendido
     FROM productos p
     LEFT JOIN detalle_ventas dv ON p.id = dv.producto_id
     LEFT JOIN ventas v ON dv.venta_id = v.id AND v.estado = 'completada'
     LEFT JOIN categorias c ON p.categoria_id = c.id
     WHERE p.activo = 1
     GROUP BY p.id, p.codigo_barras, p.nombre, c.nombre
     ORDER BY total_vendido ASC
     LIMIT 20`
  )

  return {
    masVendidos,
    menosVendidos,
  }
}

async function getReporteCategorias(fechaInicio: string | null, fechaFin: string | null) {
  let whereClause = "WHERE v.estado = 'completada'"
  const params: string[] = []

  if (fechaInicio) {
    whereClause += ' AND DATE(v.created_at) >= ?'
    params.push(fechaInicio)
  }
  if (fechaFin) {
    whereClause += ' AND DATE(v.created_at) <= ?'
    params.push(fechaFin)
  }

  const categorias = await query(
    `SELECT 
      c.id,
      c.nombre,
      c.color,
      COUNT(DISTINCT p.id) as total_productos,
      COALESCE(SUM(dv.cantidad), 0) as total_vendido,
      COALESCE(SUM(dv.subtotal), 0) as total_ingresos
     FROM categorias c
     LEFT JOIN productos p ON c.id = p.categoria_id AND p.activo = 1
     LEFT JOIN detalle_ventas dv ON p.id = dv.producto_id
     LEFT JOIN ventas v ON dv.venta_id = v.id AND v.estado = 'completada'
     WHERE c.activa = 1
     GROUP BY c.id, c.nombre, c.color
     ORDER BY total_ingresos DESC`,
    params
  )

  return { categorias }
}

async function getReporteInventario() {
  // Resumen de inventario
  const resumen = await query(
    `SELECT 
      COUNT(*) as total_productos,
      SUM(stock_actual) as total_unidades,
      SUM(stock_actual * precio_compra) as valor_inventario_compra,
      SUM(stock_actual * precio_venta) as valor_inventario_venta
     FROM productos 
     WHERE activo = 1`
  )

  // Productos con stock bajo
  const stockBajo = await query(
    `SELECT 
      p.*,
      c.nombre as categoria_nombre,
      pr.nombre as proveedor_nombre
     FROM productos p
     LEFT JOIN categorias c ON p.categoria_id = c.id
     LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
     WHERE p.stock_actual <= p.stock_minimo AND p.activo = 1
     ORDER BY (p.stock_actual - p.stock_minimo) ASC`
  )

  // Productos sin stock
  const sinStock = await query(
    `SELECT 
      p.*,
      c.nombre as categoria_nombre
     FROM productos p
     LEFT JOIN categorias c ON p.categoria_id = c.id
     WHERE p.stock_actual = 0 AND p.activo = 1`
  )

  // Últimos movimientos
  const ultimosMovimientos = await query(
    `SELECT 
      mi.*,
      p.nombre as producto_nombre,
      u.nombre as usuario_nombre
     FROM movimientos_inventario mi
     JOIN productos p ON mi.producto_id = p.id
     LEFT JOIN usuarios u ON mi.usuario_id = u.id
     ORDER BY mi.created_at DESC
     LIMIT 50`
  )

  return {
    resumen: Array.isArray(resumen) ? resumen[0] : resumen,
    stockBajo,
    sinStock,
    ultimosMovimientos,
  }
}