import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Obtener venta
    const ventas = await query(
      `SELECT 
        v.*,
        u.nombre as usuario_nombre
      FROM ventas v
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      WHERE v.id = ?`,
      [id]
    )

    const ventasArray = ventas as unknown[]
    if (ventasArray.length === 0) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      )
    }

    const venta = ventasArray[0] as Record<string, unknown>

    // Obtener detalles
    const detalles = await query(
      `SELECT 
        dv.*,
        p.nombre as producto_nombre,
        p.codigo_barras
      FROM detalle_ventas dv
      LEFT JOIN productos p ON dv.producto_id = p.id
      WHERE dv.venta_id = ?`,
      [id]
    )

    return NextResponse.json({
      ...venta,
      detalles,
    })
  } catch (error) {
    console.error('Error al obtener venta:', error)
    return NextResponse.json(
      { error: 'Error al obtener venta' },
      { status: 500 }
    )
  }
}
