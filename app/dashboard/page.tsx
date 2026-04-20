"use client"

import useSWR from 'swr'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import {
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'

const fetcher = (url: string) => fetch(url).then(res => res.json())

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value)
}

interface DashboardStats {
  ventasHoy: number
  ingresosHoy: number
  ventasMes: number
  ingresosMes: number
  totalProductos: number
  productosStockBajo: number
  totalCategorias: number
  ultimasVentas: Array<{
    id: number
    numero_venta: string
    total: number
    metodo_pago: string
    created_at: string
    usuario_nombre: string
  }>
  productosMasVendidos: Array<{
    id: number
    nombre: string
    total_vendido: number
    total_ingresos: number
  }>
  productosStockBajoDetalle: Array<{
    id: number
    nombre: string
    stock_actual: number
    stock_minimo: number
    unidad: string
    categoria_nombre: string
  }>
  ventasPorDia: Array<{
    fecha: string
    total_ventas: number
    total_ingresos: number
  }>
}

export default function DashboardPage() {
  const { user } = useAuth()
  
  const { data: stats, error, isLoading, mutate } = useSWR<DashboardStats>(
    '/api/dashboard/stats',
    fetcher,
    { refreshInterval: 30000 } // Actualizar cada 30 segundos
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner className="h-8 w-8 mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando estadísticas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-bold mb-2">Error de conexion</h2>
          <p className="text-muted-foreground mb-4">
            No se pudo conectar con la base de datos. Verifica que XAMPP este ejecutandose.
          </p>
          <Button onClick={() => mutate()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const statsCards = [
    {
      title: 'Ventas Hoy',
      value: stats.ventasHoy,
      description: `${formatCurrency(stats.ingresosHoy)} en ingresos`,
      icon: ShoppingCart,
      color: 'bg-primary text-primary-foreground',
      trend: stats.ventasHoy > 0 ? 'up' : 'neutral',
    },
    {
      title: 'Ingresos del Mes',
      value: formatCurrency(stats.ingresosMes),
      description: `${stats.ventasMes} ventas completadas`,
      icon: DollarSign,
      color: 'bg-primary text-primary-foreground',
      trend: 'up',
    },
    {
      title: 'Productos en Stock',
      value: stats.totalProductos,
      description: `${stats.totalCategorias} categorias activas`,
      icon: Package,
      color: 'bg-accent text-accent-foreground',
      trend: 'neutral',
    },
    {
      title: 'Stock Bajo',
      value: stats.productosStockBajo,
      description: 'Productos necesitan reabastecimiento',
      icon: AlertTriangle,
      color: stats.productosStockBajo > 0 ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground',
      trend: stats.productosStockBajo > 0 ? 'down' : 'neutral',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido, {user?.nombre}. Hoy es {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => mutate()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{stat.value}</span>
                {stat.trend === 'up' && (
                  <ArrowUpRight className="h-4 w-4 text-primary" />
                )}
                {stat.trend === 'down' && (
                  <ArrowDownRight className="h-4 w-4 text-destructive" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ventas Recientes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Ventas Recientes
                </CardTitle>
                <CardDescription>Ultimas transacciones registradas</CardDescription>
              </div>
              <Badge variant="secondary">{stats.ultimasVentas?.length || 0} recientes</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {!stats.ultimasVentas || stats.ultimasVentas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay ventas registradas</p>
                <p className="text-sm">Las ventas apareceran aqui en tiempo real</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.ultimasVentas.slice(0, 5).map((venta) => (
                  <div
                    key={venta.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{venta.numero_venta}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(venta.created_at), 'dd/MM HH:mm')} - {venta.usuario_nombre || 'Sistema'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{formatCurrency(venta.total)}</p>
                      <Badge variant="outline" className="text-xs">
                        {venta.metodo_pago}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Productos con Stock Bajo */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Alertas de Stock
                </CardTitle>
                <CardDescription>Productos que necesitan reabastecimiento</CardDescription>
              </div>
              <Badge variant="destructive">{stats.productosStockBajoDetalle?.length || 0}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {!stats.productosStockBajoDetalle || stats.productosStockBajoDetalle.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Todo el inventario esta en orden</p>
                <p className="text-sm">No hay productos con stock bajo</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.productosStockBajoDetalle.slice(0, 5).map((producto) => (
                  <div
                    key={producto.id}
                    className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg border border-destructive/20"
                  >
                    <div>
                      <p className="font-medium">{producto.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        {producto.categoria_nombre || 'Sin categoria'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-destructive">
                        {producto.stock_actual} / {producto.stock_minimo}
                      </p>
                      <p className="text-xs text-muted-foreground">{producto.unidad}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Productos Mas Vendidos */}
      <Card>
        <CardHeader>
          <CardTitle>Productos Mas Vendidos del Mes</CardTitle>
          <CardDescription>Top productos por cantidad vendida</CardDescription>
        </CardHeader>
        <CardContent>
          {!stats.productosMasVendidos || stats.productosMasVendidos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay datos de ventas este mes</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {stats.productosMasVendidos.map((producto, index) => (
                <div
                  key={producto.id}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">{producto.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {producto.total_vendido} vendidos - {formatCurrency(producto.total_ingresos)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
