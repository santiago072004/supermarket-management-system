import { NextRequest, NextResponse } from 'next/server'
import { query, run } from '@/lib/db'

// GET: obtener configuración como objeto clave: valor
export async function GET() {
  try {
    const configuracion = await query(
      'SELECT clave, valor, descripcion FROM configuracion ORDER BY clave ASC'
    )

    // Convertir a objeto
    const config: Record<string, string> = {}
    const configArray = configuracion as { clave: string; valor: string }[]
    for (const item of configArray) {
      config[item.clave] = item.valor
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error al obtener configuración:', error)
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500 }
    )
  }
}

// PUT: actualizar configuración
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    // SQLite no tiene ON DUPLICATE KEY UPDATE, pero puedes usar INSERT OR REPLACE
    for (const [clave, valor] of Object.entries(data)) {
      await run(
        `INSERT INTO configuracion (clave, valor)
         VALUES (?, ?)
         ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor`,
        [clave, valor]
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Configuración actualizada exitosamente' 
    })
  } catch (error) {
    console.error('Error al actualizar configuración:', error)
    return NextResponse.json(
      { error: 'Error al actualizar configuración' },
      { status: 500 }
    )
  }
}