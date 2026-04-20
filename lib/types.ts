// Tipos para el Sistema de Gestión de Supermercado

export interface Usuario {
  id: number
  nombre: string
  email: string
  rol: 'admin' | 'cajero' | 'inventario'
  activo: boolean
  ultimo_acceso?: string
  created_at: string
}

export interface Categoria {
  id: number
  nombre: string
  descripcion?: string
  color: string
  activa: boolean
  created_at: string
}

export interface Proveedor {
  id: number
  nombre: string
  contacto?: string
  telefono?: string
  email?: string
  direccion?: string
  activo: boolean
  created_at: string
}

export interface Producto {
  id: number
  codigo_barras?: string
  nombre: string
  descripcion?: string
  categoria_id?: number
  categoria?: Categoria
  proveedor_id?: number
  proveedor?: Proveedor
  precio_compra: number
  precio_venta: number
  stock_actual: number
  stock_minimo: number
  imagen_url?: string
  unidad: string
  activo: boolean
  created_at: string
}

export interface MovimientoInventario {
  id: number
  producto_id: number
  producto?: Producto
  tipo: 'entrada' | 'salida' | 'ajuste'
  cantidad: number
  stock_anterior: number
  stock_nuevo: number
  motivo?: string
  usuario_id?: number
  usuario?: Usuario
  created_at: string
}

export interface Venta {
  id: number
  numero_venta: string
  usuario_id?: number
  usuario?: Usuario
  cliente_nombre?: string
  subtotal: number
  descuento: number
  impuesto: number
  total: number
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto'
  monto_recibido?: number
  cambio?: number
  estado: 'completada' | 'cancelada' | 'pendiente'
  notas?: string
  detalles?: DetalleVenta[]
  created_at: string
}

export interface DetalleVenta {
  id: number
  venta_id: number
  producto_id: number
  producto?: Producto
  cantidad: number
  precio_unitario: number
  descuento: number
  subtotal: number
}

export interface ItemCarrito {
  producto: Producto
  cantidad: number
  subtotal: number
}

export interface ReporteVentas {
  fecha: string
  total_ventas: number
  ingresos_totales: number
  ticket_promedio: number
}

export interface ProductoMasVendido {
  id: number
  nombre: string
  codigo_barras?: string
  total_vendido: number
  total_ingresos: number
}

export interface DashboardStats {
  ventasHoy: number
  ingresosHoy: number
  productosStockBajo: number
  totalProductos: number
  totalCategorias: number
  ventasMes: number
  ingresosMes: number
}

export interface AuthState {
  user: Usuario | null
  isAuthenticated: boolean
  isLoading: boolean
}

export type PermisoAccion = 'ver' | 'crear' | 'editar' | 'eliminar'
export type PermisoModulo = 'dashboard' | 'productos' | 'inventario' | 'ventas' | 'reportes' | 'usuarios' | 'configuracion'

export const PERMISOS_ROL: Record<Usuario['rol'], Record<PermisoModulo, PermisoAccion[]>> = {
  admin: {
    dashboard: ['ver'],
    productos: ['ver', 'crear', 'editar', 'eliminar'],
    inventario: ['ver', 'crear', 'editar', 'eliminar'],
    ventas: ['ver', 'crear', 'editar', 'eliminar'],
    reportes: ['ver'],
    usuarios: ['ver', 'crear', 'editar', 'eliminar'],
    configuracion: ['ver', 'editar'],
  },
  cajero: {
    dashboard: ['ver'],
    productos: ['ver'],
    inventario: ['ver'],
    ventas: ['ver', 'crear'],
    reportes: ['ver'],
    usuarios: [],
    configuracion: [],
  },
  inventario: {
    dashboard: ['ver'],
    productos: ['ver', 'crear', 'editar'],
    inventario: ['ver', 'crear', 'editar'],
    ventas: ['ver'],
    reportes: ['ver'],
    usuarios: [],
    configuracion: [],
  },
}
