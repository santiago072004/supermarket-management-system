import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const codigo = searchParams.get('codigo')

    if (!codigo) {
      return NextResponse.json(
        { error: 'Código de barras requerido' },
        { status: 400 }
      )
    }

    const productos = await query(
      `SELECT 
        p.*,
        c.nombre as categoria_nombre,
        c.color as categoria_color
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.codigo_barras = ? AND p.activo = 1`,
      [codigo]
    )

    const productosArray = productos as unknown[]
    if (productosArray.length === 0) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(productosArray[0])
  } catch (error) {
    console.error('Error al buscar producto:', error)
    return NextResponse.json(
      { error: 'Error al buscar producto' },
      { status: 500 }
    )
  }
}
