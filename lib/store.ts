// Store de datos simulado para el sistema
// En producción, estos datos vendrían de la base de datos MySQL

import type { Usuario, Categoria, Proveedor, Producto, Venta, DetalleVenta, MovimientoInventario } from './types'

// Usuarios de demostración
export const usuarios: Usuario[] = [
  {
    id: 1,
    nombre: 'Administrador',
    email: 'admin@supermercado.com',
    rol: 'admin',
    activo: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    nombre: 'Cajero Principal',
    email: 'cajero@supermercado.com',
    rol: 'cajero',
    activo: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    nombre: 'Encargado Inventario',
    email: 'inventario@supermercado.com',
    rol: 'inventario',
    activo: true,
    created_at: '2024-01-01T00:00:00Z',
  },
]

// Categorías
export const categorias: Categoria[] = [
  { id: 1, nombre: 'Lácteos', descripcion: 'Productos lácteos y derivados', color: '#3b82f6', activa: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 2, nombre: 'Carnes', descripcion: 'Carnes rojas, pollo y mariscos', color: '#ef4444', activa: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 3, nombre: 'Bebidas', descripcion: 'Refrescos, jugos y agua', color: '#22c55e', activa: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 4, nombre: 'Panadería', descripcion: 'Pan, pasteles y productos horneados', color: '#f59e0b', activa: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 5, nombre: 'Limpieza', descripcion: 'Productos de limpieza del hogar', color: '#8b5cf6', activa: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 6, nombre: 'Frutas y Verduras', descripcion: 'Productos frescos', color: '#10b981', activa: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 7, nombre: 'Abarrotes', descripcion: 'Productos enlatados y secos', color: '#6366f1', activa: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 8, nombre: 'Snacks', descripcion: 'Botanas y dulces', color: '#ec4899', activa: true, created_at: '2024-01-01T00:00:00Z' },
]

// Proveedores
export const proveedores: Proveedor[] = [
  { id: 1, nombre: 'Distribuidora Central', contacto: 'Juan Pérez', telefono: '555-0101', email: 'ventas@distcentral.com', activo: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 2, nombre: 'Lácteos del Norte', contacto: 'María García', telefono: '555-0102', email: 'pedidos@lacteosnorte.com', activo: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 3, nombre: 'Carnes Selectas', contacto: 'Roberto López', telefono: '555-0103', email: 'info@carnesselectas.com', activo: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 4, nombre: 'Bebidas Express', contacto: 'Ana Martínez', telefono: '555-0104', email: 'contacto@bebidasexpress.com', activo: true, created_at: '2024-01-01T00:00:00Z' },
]

// Productos
export let productos: Producto[] = [
  { id: 1, codigo_barras: '7501000111111', nombre: 'Leche Entera 1L', descripcion: 'Leche entera pasteurizada', categoria_id: 1, proveedor_id: 2, precio_compra: 18.00, precio_venta: 25.50, stock_actual: 50, stock_minimo: 20, unidad: 'unidad', activo: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 2, codigo_barras: '7501000111112', nombre: 'Queso Panela 400g', descripcion: 'Queso panela fresco', categoria_id: 1, proveedor_id: 2, precio_compra: 35.00, precio_venta: 52.00, stock_actual: 30, stock_minimo: 10, unidad: 'unidad', activo: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 3, codigo_barras: '7501000111113', nombre: 'Yogurt Natural 1kg', descripcion: 'Yogurt natural sin azúcar', categoria_id: 1, proveedor_id: 2, precio_compra: 28.00, precio_venta: 42.00, stock_actual: 25, stock_minimo: 10, unidad: 'unidad', activo: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 4, codigo_barras: '7501000222221', nombre: 'Pechuga de Pollo', descripcion: 'Pechuga de pollo fresca', categoria_id: 2, proveedor_id: 3, precio_compra: 85.00, precio_venta: 125.00, stock_actual: 40, stock_minimo: 15, unidad: 'kg', activo: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 5, codigo_barras: '7501000222222', nombre: 'Carne Molida', descripcion: 'Carne molida de res', categoria_id: 2, proveedor_id: 3, precio_compra: 95.00, precio_venta: 145.00, stock_actual: 8, stock_minimo: 15, unidad: 'kg', activo: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 6, codigo_barras: '7501000333331', nombre: 'Coca-Cola 600ml', descripcion: 'Refresco de cola', categoria_id: 3, proveedor_id: 4, precio_compra: 12.00, precio_venta: 18.00, stock_actual: 100, stock_minimo: 30, unidad: 'unidad', activo: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 7, codigo_barras: '7501000333332', nombre: 'Agua Natural 1L', descripcion: 'Agua purificada', categoria_id: 3, proveedor_id: 4, precio_compra: 8.00, precio_venta: 14.00, stock_actual: 80, stock_minimo: 25, unidad: 'unidad', activo: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 8, codigo_barras: '7501000333333', nombre: 'Jugo de Naranja 1L', descripcion: 'Jugo natural de naranja', categoria_id: 3, proveedor_id: 4, precio_compra: 22.00, precio_venta: 35.00, stock_actual: 45, stock_minimo: 15, unidad: 'unidad', activo: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 9, codigo_barras: '7501000444441', nombre: 'Pan Blanco', descripcion: 'Pan blanco de caja', categoria_id: 4, proveedor_id: 1, precio_compra: 32.00, precio_venta: 48.00, stock_actual: 5, stock_minimo: 15, unidad: 'unidad', activo: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 10, codigo_barras: '7501000444442', nombre: 'Pan Integral', descripcion: 'Pan integral de caja', categoria_id: 4, proveedor_id: 1, precio_compra: 38.00, precio_venta: 55.00, stock_actual: 35, stock_minimo: 15, unidad: 'unidad', activo: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 11, codigo_barras: '7501000555551', nombre: 'Detergente Líquido 1L', descripcion: 'Detergente para ropa', categoria_id: 5, proveedor_id: 1, precio_compra: 45.00, precio_venta: 68.00, stock_actual: 30, stock_minimo: 10, unidad: 'unidad', activo: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 12, codigo_barras: '7501000555552', nombre: 'Cloro 1L', descripcion: 'Cloro desinfectante', categoria_id: 5, proveedor_id: 1, precio_compra: 18.00, precio_venta: 28.00, stock_actual: 50, stock_minimo: 20, unidad: 'unidad', activo: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 13, codigo_barras: '7501000666661', nombre: 'Manzana Roja', descripcion: 'Manzana roja fresca', categoria_id: 6, proveedor_id: 1, precio_compra: 25.00, precio_venta: 42.00, stock_actual: 60, stock_minimo: 20, unidad: 'kg', activo: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 14, codigo_barras: '7501000666662', nombre: 'Plátano', descripcion: 'Plátano maduro', categoria_id: 6, proveedor_id: 1, precio_compra: 15.00, precio_venta: 25.00, stock_actual: 70, stock_minimo: 25, unidad: 'kg', activo: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 15, codigo_barras: '7501000666663', nombre: 'Tomate', descripcion: 'Tomate bola rojo', categoria_id: 6, proveedor_id: 1, precio_compra: 20.00, precio_venta: 35.00, stock_actual: 50, stock_minimo: 20, unidad: 'kg', activo: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 16, codigo_barras: '7501000777771', nombre: 'Arroz 1kg', descripcion: 'Arroz grano largo', categoria_id: 7, proveedor_id: 1, precio_compra: 22.00, precio_venta: 32.00, stock_actual: 80, stock_minimo: 30, unidad: 'unidad', activo: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 17, codigo_barras: '7501000777772', nombre: 'Frijol Negro 1kg', descripcion: 'Frijol negro seco', categoria_id: 7, proveedor_id: 1, precio_compra: 28.00, precio_venta: 42.00, stock_actual: 60, stock_minimo: 25, unidad: 'unidad', activo: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 18, codigo_barras: '7501000777773', nombre: 'Aceite Vegetal 1L', descripcion: 'Aceite vegetal para cocinar', categoria_id: 7, proveedor_id: 1, precio_compra: 35.00, precio_venta: 52.00, stock_actual: 12, stock_minimo: 15, unidad: 'unidad', activo: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 19, codigo_barras: '7501000888881', nombre: 'Papas Fritas 150g', descripcion: 'Papas fritas sabor natural', categoria_id: 8, proveedor_id: 1, precio_compra: 18.00, precio_venta: 28.00, stock_actual: 55, stock_minimo: 20, unidad: 'unidad', activo: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 20, codigo_barras: '7501000888882', nombre: 'Galletas Chocolate', descripcion: 'Galletas con chispas de chocolate', categoria_id: 8, proveedor_id: 1, precio_compra: 22.00, precio_venta: 35.00, stock_actual: 40, stock_minimo: 15, unidad: 'unidad', activo: true, created_at: '2024-01-01T00:00:00Z' },
]

// Ventas - inicialmente vacías, se generarán algunas de demostración
export let ventas: Venta[] = []
export let detalleVentas: DetalleVenta[] = []
export let movimientosInventario: MovimientoInventario[] = []

// Generar ventas de demostración
function generarVentasDemo() {
  const hoy = new Date()
  let ventaId = 1
  let detalleId = 1

  // Generar 30 ventas en los últimos 30 días
  for (let i = 0; i < 30; i++) {
    const fecha = new Date(hoy)
    fecha.setDate(hoy.getDate() - Math.floor(Math.random() * 30))
    fecha.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60))

    const numItems = Math.floor(Math.random() * 5) + 1
    const detalles: DetalleVenta[] = []
    let subtotal = 0

    for (let j = 0; j < numItems; j++) {
      const productoIndex = Math.floor(Math.random() * productos.length)
      const producto = productos[productoIndex]
      const cantidad = Math.floor(Math.random() * 3) + 1
      const itemSubtotal = producto.precio_venta * cantidad

      detalles.push({
        id: detalleId++,
        venta_id: ventaId,
        producto_id: producto.id,
        producto,
        cantidad,
        precio_unitario: producto.precio_venta,
        descuento: 0,
        subtotal: itemSubtotal,
      })
      subtotal += itemSubtotal
    }

    const venta: Venta = {
      id: ventaId,
      numero_venta: `V${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}${String(fecha.getDate()).padStart(2, '0')}${String(ventaId).padStart(4, '0')}`,
      usuario_id: Math.random() > 0.5 ? 1 : 2,
      subtotal,
      descuento: 0,
      impuesto: 0,
      total: subtotal,
      metodo_pago: Math.random() > 0.3 ? 'efectivo' : 'tarjeta',
      estado: 'completada',
      detalles,
      created_at: fecha.toISOString(),
    }

    ventas.push(venta)
    detalleVentas.push(...detalles)
    ventaId++
  }

  // Ordenar ventas por fecha (más recientes primero)
  ventas.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

generarVentasDemo()

// Funciones auxiliares
export function getProductoConCategoria(producto: Producto): Producto {
  return {
    ...producto,
    categoria: categorias.find(c => c.id === producto.categoria_id),
    proveedor: proveedores.find(p => p.id === producto.proveedor_id),
  }
}

export function getProductosConCategorias(): Producto[] {
  return productos.map(getProductoConCategoria)
}

export function getProductosStockBajo(): Producto[] {
  return productos.filter(p => p.stock_actual <= p.stock_minimo && p.activo)
}

export function getVentasHoy(): Venta[] {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return ventas.filter(v => {
    const fechaVenta = new Date(v.created_at)
    fechaVenta.setHours(0, 0, 0, 0)
    return fechaVenta.getTime() === hoy.getTime() && v.estado === 'completada'
  })
}

export function getVentasMes(): Venta[] {
  const hoy = new Date()
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  return ventas.filter(v => {
    const fechaVenta = new Date(v.created_at)
    return fechaVenta >= inicioMes && v.estado === 'completada'
  })
}

export function getDashboardStats() {
  const ventasHoyList = getVentasHoy()
  const ventasMesList = getVentasMes()
  
  return {
    ventasHoy: ventasHoyList.length,
    ingresosHoy: ventasHoyList.reduce((sum, v) => sum + v.total, 0),
    productosStockBajo: getProductosStockBajo().length,
    totalProductos: productos.filter(p => p.activo).length,
    totalCategorias: categorias.filter(c => c.activa).length,
    ventasMes: ventasMesList.length,
    ingresosMes: ventasMesList.reduce((sum, v) => sum + v.total, 0),
  }
}

// Funciones para modificar datos
export function actualizarStockProducto(productoId: number, cantidad: number, tipo: 'entrada' | 'salida' | 'ajuste', motivo: string) {
  const index = productos.findIndex(p => p.id === productoId)
  if (index === -1) return false

  const producto = productos[index]
  const stockAnterior = producto.stock_actual
  let stockNuevo = stockAnterior

  if (tipo === 'entrada') {
    stockNuevo = stockAnterior + cantidad
  } else if (tipo === 'salida') {
    stockNuevo = Math.max(0, stockAnterior - cantidad)
  } else {
    stockNuevo = cantidad
  }

  productos[index] = { ...producto, stock_actual: stockNuevo }

  movimientosInventario.push({
    id: movimientosInventario.length + 1,
    producto_id: productoId,
    tipo,
    cantidad,
    stock_anterior: stockAnterior,
    stock_nuevo: stockNuevo,
    motivo,
    created_at: new Date().toISOString(),
  })

  return true
}

export function registrarVenta(items: { producto_id: number; cantidad: number }[], metodoPago: Venta['metodo_pago'], montoRecibido?: number): Venta | null {
  if (items.length === 0) return null

  const now = new Date()
  const ventaId = ventas.length + 1
  const detalles: DetalleVenta[] = []
  let subtotal = 0
  let detalleIdBase = detalleVentas.length + 1

  for (const item of items) {
    const producto = productos.find(p => p.id === item.producto_id)
    if (!producto || producto.stock_actual < item.cantidad) continue

    const itemSubtotal = producto.precio_venta * item.cantidad
    detalles.push({
      id: detalleIdBase++,
      venta_id: ventaId,
      producto_id: producto.id,
      producto,
      cantidad: item.cantidad,
      precio_unitario: producto.precio_venta,
      descuento: 0,
      subtotal: itemSubtotal,
    })
    subtotal += itemSubtotal

    // Actualizar stock
    actualizarStockProducto(producto.id, item.cantidad, 'salida', `Venta #${ventaId}`)
  }

  if (detalles.length === 0) return null

  const venta: Venta = {
    id: ventaId,
    numero_venta: `V${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(ventaId).padStart(4, '0')}`,
    usuario_id: 1,
    subtotal,
    descuento: 0,
    impuesto: 0,
    total: subtotal,
    metodo_pago: metodoPago,
    monto_recibido: montoRecibido,
    cambio: montoRecibido ? montoRecibido - subtotal : undefined,
    estado: 'completada',
    detalles,
    created_at: now.toISOString(),
  }

  ventas.unshift(venta)
  detalleVentas.push(...detalles)

  return venta
}

export function buscarProductoPorCodigo(codigo: string): Producto | undefined {
  return productos.find(p => p.codigo_barras === codigo && p.activo)
}

export function buscarProductos(termino: string): Producto[] {
  const terminoLower = termino.toLowerCase()
  return productos.filter(p => 
    p.activo && (
      p.nombre.toLowerCase().includes(terminoLower) ||
      p.codigo_barras?.includes(termino) ||
      p.descripcion?.toLowerCase().includes(terminoLower)
    )
  )
}
