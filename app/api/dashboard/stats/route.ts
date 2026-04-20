import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

interface VentaStats {
  total_ventas: number
  total_ingresos: number
}

interface ProductoCount {
  total: number
}

interface ProductoBajo {
  total: number
}

interface CategoriaCount {
  total: number
}

export async function GET() {
  try {
    // Ventas de hoy
    const ventasHoy = await query<VentaStats[]>(
      `SELECT COUNT(*) as total_ventas, COALESCE(SUM(total), 0) as total_ingresos
       FROM ventas 
       WHERE DATE(created_at) = DATE('now', 'localtime') AND estado = 'completada'`
    ) || []

    // Ventas del mes
    const ventasMes = await query<VentaStats[]>(
      `SELECT COUNT(*) as total_ventas, COALESCE(SUM(total), 0) as total_ingresos
       FROM ventas 
       WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime')
         AND estado = 'completada'`
    ) || []

    // Total de productos activos
    const totalProductos = await query<ProductoCount[]>(
      'SELECT COUNT(*) as total FROM productos WHERE activo = 1'
    ) || []

    // Productos con stock bajo
    const productosStockBajo = await query<ProductoBajo[]>(
      'SELECT COUNT(*) as total FROM productos WHERE stock_actual <= stock_minimo AND activo = 1'
    ) || []

    // Total de categorías
    const totalCategorias = await query<CategoriaCount[]>(
      'SELECT COUNT(*) as total FROM categorias WHERE activa = 1'
    ) || []

    // Últimas ventas
    const ultimasVentas = await query(
      `SELECT v.*, u.nombre as usuario_nombre
       FROM ventas v
       LEFT JOIN usuarios u ON v.usuario_id = u.id
       WHERE v.estado = 'completada'
       ORDER BY v.created_at DESC
       LIMIT 5`
    ) || []

    // Productos más vendidos del mes
    const productosMasVendidos = await query(
      `SELECT 
        p.id,
        p.nombre,
        p.codigo_barras,
        SUM(dv.cantidad) as total_vendido,
        SUM(dv.subtotal) as total_ingresos
       FROM detalle_ventas dv
       JOIN productos p ON dv.producto_id = p.id
       JOIN ventas v ON dv.venta_id = v.id
       WHERE v.estado = 'completada'
         AND strftime('%Y-%m', v.created_at) = strftime('%Y-%m', 'now', 'localtime')
       GROUP BY p.id, p.nombre, p.codigo_barras
       ORDER BY total_vendido DESC
       LIMIT 5`
    ) || []

    // Productos con stock bajo (detalle)
    const productosStockBajoDetalle = await query(
      `SELECT p.*, c.nombre as categoria_nombre
       FROM productos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       WHERE p.stock_actual <= p.stock_minimo AND p.activo = 1
       ORDER BY p.stock_actual ASC
       LIMIT 10`
    ) || []

    // Ventas por día de la última semana
    const ventasPorDia = await query(
      `SELECT 
        DATE(created_at, 'localtime') as fecha,
        COUNT(*) as total_ventas,
        COALESCE(SUM(total), 0) as total_ingresos
       FROM ventas
       WHERE 
         DATE(created_at, 'localtime') >= DATE('now', '-6 days', 'localtime')
         AND estado = 'completada'
       GROUP BY DATE(created_at, 'localtime')
       ORDER BY fecha ASC`
    ) || []

    return NextResponse.json({
      ventasHoy: ventasHoy?.[0]?.total_ventas ?? 0,
      ingresosHoy: ventasHoy?.[0]?.total_ingresos ?? 0,
      ventasMes: ventasMes?.[0]?.total_ventas ?? 0,
      ingresosMes: ventasMes?.[0]?.total_ingresos ?? 0,
      totalProductos: totalProductos?.[0]?.total ?? 0,
      productosStockBajo: productosStockBajo?.[0]?.total ?? 0,
      totalCategorias: totalCategorias?.[0]?.total ?? 0,
      ultimasVentas,
      productosMasVendidos,
      productosStockBajoDetalle,
      ventasPorDia,
    })
  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}