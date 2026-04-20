import { NextRequest, NextResponse } from 'next/server'
import { query, run } from '@/lib/db'

// GET
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const productos = await query(
      `SELECT 
        p.*,
        c.nombre as categoria_nombre,
        pr.nombre as proveedor_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
      WHERE p.id = ?`,
      [id]
    )

    if (!productos || productos.length === 0) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(productos[0])
  } catch (error) {
    console.error('Error GET producto:', error)
    return NextResponse.json(
      { error: 'Error al obtener producto' },
      { status: 500 }
    )
  }
}

// PUT
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    await run(
      `UPDATE productos SET
        codigo_barras = ?,
        nombre = ?,
        descripcion = ?,
        categoria_id = ?,
        proveedor_id = ?,
        precio_compra = ?,
        precio_venta = ?,
        stock_actual = ?,
        stock_minimo = ?,
        unidad = ?,
        updated_at = datetime('now')
      WHERE id = ?`,
      [
        data.codigo_barras || null,
        data.nombre,
        data.descripcion || null,
        data.categoria_id || null,
        data.proveedor_id || null,
        data.precio_compra,
        data.precio_venta,
        data.stock_actual,
        data.stock_minimo,
        data.unidad || 'unidad',
        id,
      ]
    )

    return NextResponse.json({
      success: true,
      message: 'Producto actualizado'
    })
  } catch (error) {
    console.error('Error PUT producto:', error)
    return NextResponse.json(
      { error: 'Error al actualizar producto' },
      { status: 500 }
    )
  }
}

// DELETE 
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    console.log(' Intentando eliminar producto ID:', id)

    // Verificar si existe
    const existe = await query(
      'SELECT id FROM productos WHERE id = ?',
      [id]
    )

    console.log('🔎 Existe:', existe)

    if (existe.length === 0) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }


    await run('DELETE FROM detalle_ventas WHERE producto_id = ?', [id])


    const result = await run(
      'DELETE FROM productos WHERE id = ?',
      [id]
    )

    console.log('Filas eliminadas:', result.changes)

    return NextResponse.json({
      success: true,
      message: 'Producto eliminado correctamente'
    })

  } catch (error) {
    console.error('Error DELETE producto:', error)
    return NextResponse.json(
      { error: 'Error al eliminar producto', detalle: String(error) },
      { status: 500 }
    )
  }
}