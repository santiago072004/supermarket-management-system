"use client"

import { useState, useMemo, useRef, useEffect } from 'react'
import useSWR from 'swr'
import { useAuth } from '@/lib/auth-context'
import type { ItemCarrito, Producto } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ShoppingCart,
  Barcode,
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Receipt,
  Check,
  History,
  Calculator,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const fetcher = (url: string) => fetch(url).then(res => res.json())

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value)
}

interface ProductoAPI extends Producto {
  categoria_nombre?: string
  categoria_color?: string
}

interface VentaAPI {
  id: number
  numero_venta: string
  total: number
  metodo_pago: string
  estado: string
  created_at: string
  usuario_nombre?: string
}

export default function VentasPage() {
  const { tienePermiso, user } = useAuth()
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [codigoBarra, setCodigoBarra] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo')
  const [montoRecibido, setMontoRecibido] = useState('')
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [ultimaVenta, setUltimaVenta] = useState<{ numero_venta: string; total: number; cambio: number } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const codigoInputRef = useRef<HTMLInputElement>(null)

  // SECCIÓN CRÍTICA CORREGIDA: Productos y Ventas siempre como array
  const { data: productosData, isLoading: loadingProductos } = useSWR('/api/productos', fetcher)
  const productos: ProductoAPI[] = productosData?.productos || []

  const { data: ventasData, mutate: mutateVentas, isLoading: loadingVentas } = useSWR('/api/ventas?limit=50', fetcher, {
    refreshInterval: 30000,
  })
  const ventas: VentaAPI[] = ventasData?.ventas || []

  const puedeVender = tienePermiso('ventas', 'crear')

  useEffect(() => {
    if (puedeVender) {
      codigoInputRef.current?.focus()
    }
  }, [puedeVender])

  const resultadosBusqueda = useMemo(() => {
    if (!busqueda.trim() || !productos) return []
    const termino = busqueda.toLowerCase()
    return productos.filter(p =>
      p.nombre.toLowerCase().includes(termino) ||
      p.codigo_barras?.includes(busqueda) ||
      p.descripcion?.toLowerCase().includes(termino)
    ).slice(0, 8)
  }, [busqueda, productos])

  const totales = useMemo(() => {
    const subtotal = carrito.reduce((sum, item) => sum + item.subtotal, 0)
    return {
      subtotal,
      descuento: 0,
      impuesto: 0,
      total: subtotal,
    }
  }, [carrito])

  const cambio = useMemo(() => {
    const monto = parseFloat(montoRecibido) || 0
    return Math.max(0, monto - totales.total)
  }, [montoRecibido, totales.total])

  const buscarProductoPorCodigo = async (codigo: string): Promise<ProductoAPI | null> => {
    try {
      const response = await fetch(`/api/productos/buscar?codigo=${encodeURIComponent(codigo)}`)
      if (!response.ok) return null
      return await response.json()
    } catch {
      return null
    }
  }

  const handleCodigoBarraSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!codigoBarra.trim()) return

    const producto = await buscarProductoPorCodigo(codigoBarra.trim())

    if (producto) {
      agregarAlCarrito(producto)
      toast.success(`${producto.nombre} agregado`)
    } else {
      toast.error('Producto no encontrado')
    }

    setCodigoBarra('')
    codigoInputRef.current?.focus()
  }

  const agregarAlCarrito = (producto: ProductoAPI) => {
    setCarrito(prev => {
      const existente = prev.find(item => item.producto.id === producto.id)

      if (existente) {
        if (existente.cantidad >= producto.stock_actual) {
          toast.error('Stock insuficiente')
          return prev
        }
        return prev.map(item =>
          item.producto.id === producto.id
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                subtotal: (item.cantidad + 1) * item.producto.precio_venta,
              }
            : item
        )
      }

      if (producto.stock_actual < 1) {
        toast.error('Producto sin stock')
        return prev
      }

      return [
        ...prev,
        {
          producto,
          cantidad: 1,
          subtotal: producto.precio_venta,
        },
      ]
    })
  }

  const actualizarCantidad = (productoId: number, nuevaCantidad: number) => {
    if (nuevaCantidad < 1) {
      eliminarDelCarrito(productoId)
      return
    }

    setCarrito(prev =>
      prev.map(item => {
        if (item.producto.id === productoId) {
          if (nuevaCantidad > item.producto.stock_actual) {
            toast.error('Stock insuficiente')
            return item
          }
          return {
            ...item,
            cantidad: nuevaCantidad,
            subtotal: nuevaCantidad * item.producto.precio_venta,
          }
        }
        return item
      })
    )
  }

  const eliminarDelCarrito = (productoId: number) => {
    setCarrito(prev => prev.filter(item => item.producto.id !== productoId))
  }

  const limpiarCarrito = () => {
    setCarrito([])
    setBusqueda('')
    setCodigoBarra('')
  }

  const iniciarPago = () => {
    if (carrito.length === 0) {
      toast.error('El carrito esta vacio')
      return
    }
    setMontoRecibido('')
    setShowPaymentDialog(true)
  }

  const procesarVenta = async () => {
    if (metodoPago === 'efectivo') {
      const monto = parseFloat(montoRecibido) || 0
      if (monto < totales.total) {
        toast.error('El monto recibido es insuficiente')
        return
      }
    }

    setIsProcessing(true)

    try {
      const items = carrito.map(item => ({
        producto_id: item.producto.id,
        cantidad: item.cantidad,
        precio_unitario: item.producto.precio_venta,
        descuento: 0,
      }))

      const response = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          metodo_pago: metodoPago,
          monto_recibido: metodoPago === 'efectivo' ? parseFloat(montoRecibido) : null,
          usuario_id: user?.id,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al procesar la venta')
      }

      setUltimaVenta({
        numero_venta: result.numero_venta,
        total: result.total,
        cambio: result.cambio || 0,
      })
      
      setShowPaymentDialog(false)
      setShowSuccessDialog(true)
      limpiarCarrito()
      mutateVentas()
      
      toast.success('Venta registrada exitosamente')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al procesar la venta')
    } finally {
      setIsProcessing(false)
    }
  }

  if (loadingProductos) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner className="h-8 w-8 mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando punto de venta...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="venta" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <ShoppingCart className="h-8 w-8 text-primary" />
              Punto de Venta
            </h1>
            <p className="text-muted-foreground mt-1">
              Registra ventas y gestiona transacciones
            </p>
          </div>
          <TabsList>
            <TabsTrigger value="venta" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Nueva Venta
            </TabsTrigger>
            <TabsTrigger value="historial" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Historial
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="venta" className="space-y-6">
          {!puedeVender ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                  <h3 className="text-lg font-semibold mb-2">Sin permisos</h3>
                  <p className="text-muted-foreground">
                    No tienes permisos para realizar ventas
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Panel de busqueda y productos */}
              <div className="lg:col-span-2 space-y-4">
                {/* Busqueda por codigo de barras */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Barcode className="h-5 w-5" />
                      Escanear Codigo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCodigoBarraSubmit} className="flex gap-2">
                      <Input
                        ref={codigoInputRef}
                        placeholder="Escanea o escribe el codigo de barras"
                        value={codigoBarra}
                        onChange={(e) => setCodigoBarra(e.target.value)}
                        className="flex-1"
                        autoFocus
                      />
                      <Button type="submit">
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Busqueda por nombre */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Buscar Producto
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input
                      placeholder="Buscar por nombre o descripcion..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                    />
                    {resultadosBusqueda.length > 0 && (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {resultadosBusqueda.map((producto) => (
                          <button
                            key={producto.id}
                            onClick={() => {
                              agregarAlCarrito(producto)
                              setBusqueda('')
                            }}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors text-left"
                          >
                            <div className="min-w-0">
                              <p className="font-medium truncate">{producto.nombre}</p>
                              <p className="text-sm text-muted-foreground">
                                Stock: {producto.stock_actual}
                              </p>
                            </div>
                            <span className="font-bold text-primary ml-2">
                              {formatCurrency(producto.precio_venta)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Items en el carrito */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Carrito
                      </CardTitle>
                      <Badge variant="secondary">{carrito.length} items</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {carrito.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>El carrito esta vacio</p>
                        <p className="text-sm">Escanea o busca productos para comenzar</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-3">
                          {carrito.map((item) => (
                            <div
                              key={item.producto.id}
                              className="flex items-center justify-between p-3 rounded-lg border"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{item.producto.nombre}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatCurrency(item.producto.precio_venta)} x {item.cantidad}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center border rounded-lg">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => actualizarCantidad(item.producto.id, item.cantidad - 1)}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-8 text-center font-medium">{item.cantidad}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => actualizarCantidad(item.producto.id, item.cantidad + 1)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                                <span className="font-bold w-24 text-right">
                                  {formatCurrency(item.subtotal)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => eliminarDelCarrito(item.producto.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Panel de totales y pago */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Resumen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(totales.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Descuento</span>
                        <span>{formatCurrency(totales.descuento)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary">{formatCurrency(totales.total)}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={iniciarPago}
                      disabled={carrito.length === 0}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Procesar Pago
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={limpiarCarrito}
                      disabled={carrito.length === 0}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Limpiar Carrito
                    </Button>
                  </CardFooter>
                </Card>

                {/* Accesos rapidos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Accesos Rapidos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {productos.slice(0, 4).map((producto) => (
                        <Button
                          key={producto.id}
                          variant="outline"
                          className="h-auto py-3 px-2 flex flex-col items-center justify-center"
                          onClick={() => agregarAlCarrito(producto)}
                        >
                          <span className="text-xs truncate w-full text-center">{producto.nombre}</span>
                          <span className="text-xs font-bold text-primary mt-1">
                            {formatCurrency(producto.precio_venta)}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="historial">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Historial de Ventas</CardTitle>
                  <CardDescription>Ultimas transacciones registradas</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => mutateVentas()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingVentas ? (
                <div className="text-center py-8">
                  <Spinner className="h-8 w-8 mx-auto mb-4" />
                  <p className="text-muted-foreground">Cargando ventas...</p>
                </div>
              ) : !ventas || ventas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay ventas registradas</p>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No. Venta</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Metodo</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ventas.map((venta) => (
                        <TableRow key={venta.id}>
                          <TableCell className="font-mono font-medium">
                            {venta.numero_venta}
                          </TableCell>
                          <TableCell>
                            {format(new Date(venta.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                          </TableCell>
                          <TableCell>{venta.usuario_nombre || 'Sistema'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {venta.metodo_pago === 'efectivo' && <Banknote className="h-3 w-3 mr-1" />}
                              {venta.metodo_pago === 'tarjeta' && <CreditCard className="h-3 w-3 mr-1" />}
                              {venta.metodo_pago}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {formatCurrency(venta.total)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={venta.estado === 'completada' ? 'default' : 'destructive'}
                              className={venta.estado === 'completada' ? 'bg-primary' : ''}
                            >
                              {venta.estado}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de pago */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Procesar Pago</DialogTitle>
            <DialogDescription>
              Total a cobrar: {formatCurrency(totales.total)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Metodo de Pago</Label>
              <Select
                value={metodoPago}
                onValueChange={(value: 'efectivo' | 'tarjeta' | 'transferencia') => setMetodoPago(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">
                    <span className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      Efectivo
                    </span>
                  </SelectItem>
                  <SelectItem value="tarjeta">
                    <span className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Tarjeta
                    </span>
                  </SelectItem>
                  <SelectItem value="transferencia">
                    <span className="flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      Transferencia
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {metodoPago === 'efectivo' && (
              <>
                <div className="space-y-2">
                  <Label>Monto Recibido</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={montoRecibido}
                    onChange={(e) => setMontoRecibido(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Cambio:</span>
                    <span className="text-primary">{formatCurrency(cambio)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={procesarVenta} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Spinner className="h-4 w-4 mr-2" />
                  Procesando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirmar Venta
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de exito */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Check className="h-6 w-6" />
              Venta Completada
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">Numero de Venta</p>
              <p className="text-2xl font-bold font-mono">{ultimaVenta?.numero_venta}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(ultimaVenta?.total || 0)}
              </p>
            </div>
            {ultimaVenta && ultimaVenta.cambio > 0 && (
              <div className="p-4 rounded-lg bg-accent">
                <p className="text-sm text-muted-foreground">Cambio</p>
                <p className="text-2xl font-bold">{formatCurrency(ultimaVenta.cambio)}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button className="w-full" onClick={() => setShowSuccessDialog(false)}>
              Nueva Venta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}