"use client"

import { useEffect, useState, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Warehouse, PackagePlus, PackageMinus, AlertTriangle, Search,
  ArrowUpRight, ArrowDownRight, History, Barcode,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"

type Producto = {
  id: number
  nombre: string
  codigo_barras: string
  stock_actual: number
  stock_minimo: number
  unidad: string
  activo: number
  categoria_id: number
  categoria_nombre: string
  categoria_color: string
}

type Movimiento = {
  id: number
  producto_id: number
  cantidad: number
  tipo: "entrada" | "salida" | "ajuste"
  stock_anterior: number
  stock_nuevo: number
  motivo: string
  created_at: string
  producto_nombre?: string
}

export default function InventarioPage() {
  const { tienePermiso } = useAuth()
  const [productos, setProductos] = useState<Producto[]>([])
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [codigoBarras, setCodigoBarras] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<"entrada" | "salida" | "ajuste">("entrada")
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null)
  const [cantidad, setCantidad] = useState("")
  const [motivo, setMotivo] = useState("")

  // Cargar productos reales
  function cargarProductos() {
    fetch("/api/productos")
      .then((res) => res.json())
      .then((data) => setProductos(data.productos || []))
  }
  // Cargar movimientos inventario reales (NOTA: aquí es donde se corrigió)
  function cargarMovimientos() {
    fetch("/api/movimientos_inventario?limit=20")
      .then((res) => res.json())
      .then((data) => setMovimientos(data.movimientos || []))
  }
  useEffect(() => {
    cargarProductos()
    cargarMovimientos()
  }, [])

  const puedeModificar = tienePermiso("inventario", "crear")

  // STOCK BAJO, FILTROS
  const productosFiltrados = useMemo(
    () =>
      productos.filter(
        (p) =>
          (p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.codigo_barras || "").includes(searchTerm)
          ) && p.activo
      ),
    [productos, searchTerm]
  )

  const productosStockBajo = useMemo(
    () => productosFiltrados.filter((p) => p.stock_actual <= p.stock_minimo),
    [productosFiltrados]
  )

  // BUSCAR POR CÓDIGO DE BARRAS
  const handleBuscarPorCodigo = () => {
    if (!codigoBarras.trim()) return
    const producto = productos.find((p) => p.codigo_barras === codigoBarras.trim())
    if (producto) {
      setSelectedProduct(producto)
      setDialogType("entrada")
      setDialogOpen(true)
      setCodigoBarras("")
    } else {
      toast.error("Producto no encontrado con ese código de barras")
    }
  }

  const handleOpenDialog = (
    producto: Producto,
    tipo: "entrada" | "salida" | "ajuste"
  ) => {
    setSelectedProduct(producto)
    setDialogType(tipo)
    setCantidad("")
    setMotivo("")
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedProduct(null)
    setCantidad("")
    setMotivo("")
  }

  // REGISTRO REAL DE MOVIMIENTOS
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct || !cantidad) {
      toast.error("Por favor ingresa la cantidad")
      return
    }
    const cantidadNum = parseInt(cantidad)
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      toast.error("Ingresa una cantidad válida")
      return
    }
    if (dialogType === "salida" && cantidadNum > selectedProduct.stock_actual) {
      toast.error("No hay suficiente stock disponible")
      return
    }
    const motivoFinal =
      motivo ||
      (dialogType === "entrada"
        ? "Entrada de mercancía"
        : dialogType === "salida"
        ? "Salida de mercancía"
        : "Ajuste de inventario")

    // REGISTRA MOVIMIENTO EN LA BASE REAL
    const resp = await fetch("/api/movimientos_inventario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        producto_id: selectedProduct.id,
        tipo: dialogType,
        cantidad: cantidadNum,
        motivo: motivoFinal,
      }),
    })
    const data = await resp.json()
    if (data.success) {
      toast.success(data.message || "Actualización hecha")
      cargarProductos()
      cargarMovimientos()
      handleCloseDialog()
    } else {
      toast.error(data.error || "Error al actualizar el stock")
    }
  }

  // MOVIMIENTOS RECIENTES
  const movimientosRecientes = useMemo(
    () =>
      movimientos.map((m) => ({
        ...m,
        producto: productos.find((p) => p.id === m.producto_id),
      })),
    [movimientos, productos]
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Warehouse className="h-8 w-8 text-primary" />
          Gestión de Inventario
        </h1>
        <p className="text-muted-foreground mt-1">
          Controla las entradas, salidas y ajustes de stock
        </p>
      </div>
      {/* Escaneo Rápido */}
      {puedeModificar && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="codigo" className="flex items-center gap-2">
                  <Barcode className="h-4 w-4" />
                  Escanear Código de Barras
                </Label>
                <Input
                  id="codigo"
                  placeholder="Escanea o ingresa el código de barras"
                  value={codigoBarras}
                  onChange={(e) => setCodigoBarras(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleBuscarPorCodigo()}
                  className="font-mono"
                />
              </div>
              <Button onClick={handleBuscarPorCodigo} className="w-full sm:w-auto">
                <PackagePlus className="h-4 w-4 mr-2" />
                Registrar Entrada
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="inventario" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventario">Inventario</TabsTrigger>
          <TabsTrigger value="stock-bajo" className="relative">
            Stock Bajo
            {productosStockBajo.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                {productosStockBajo.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
        </TabsList>

        {/* Tab: Inventario */}
        <TabsContent value="inventario" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos por nombre o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Control de Stock</CardTitle>
              <CardDescription>
                {productosFiltrados.length} productos en inventario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-center">Stock Actual</TableHead>
                      <TableHead className="text-center">Stock Mínimo</TableHead>
                      <TableHead>Estado</TableHead>
                      {puedeModificar && (
                        <TableHead className="text-right">Acciones</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={puedeModificar ? 7 : 6}
                          className="h-32 text-center"
                        >
                          <Warehouse className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                          <p className="text-muted-foreground">
                            No se encontraron productos
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      productosFiltrados.map((producto) => (
                        <TableRow key={producto.id}>
                          <TableCell className="font-mono text-sm">
                            {producto.codigo_barras || "-"}
                          </TableCell>
                          <TableCell className="font-medium">
                            {producto.nombre}
                          </TableCell>
                          <TableCell>
                            {producto.categoria_nombre ? (
                              <Badge
                                variant="outline"
                                style={{
                                  borderColor: producto.categoria_color,
                                  color: producto.categoria_color,
                                }}
                              >
                                {producto.categoria_nombre}
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={
                                producto.stock_actual <= producto.stock_minimo
                                  ? "text-destructive font-bold"
                                  : "font-medium"
                              }
                            >
                              {producto.stock_actual}
                            </span>
                            <span className="text-muted-foreground text-sm ml-1">
                              {producto.unidad}
                            </span>
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground">
                            {producto.stock_minimo}
                          </TableCell>
                          <TableCell>
                            {producto.stock_actual <= producto.stock_minimo ? (
                              <Badge variant="destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Bajo
                              </Badge>
                            ) : producto.stock_actual <=
                              producto.stock_minimo * 1.5 ? (
                              <Badge variant="secondary">Medio</Badge>
                            ) : (
                              <Badge className="bg-primary text-primary-foreground">
                                Normal
                              </Badge>
                            )}
                          </TableCell>
                          {puedeModificar && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleOpenDialog(producto, "entrada")
                                  }
                                  title="Entrada"
                                >
                                  <PackagePlus className="h-4 w-4 text-primary" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleOpenDialog(producto, "salida")
                                  }
                                  title="Salida"
                                >
                                  <PackageMinus className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Stock Bajo */}
        <TabsContent value="stock-bajo">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Productos con Stock Bajo
              </CardTitle>
              <CardDescription>
                Estos productos necesitan reabastecimiento urgente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {productosStockBajo.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Warehouse className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Todo el inventario está en orden</p>
                  <p>No hay productos con stock bajo</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {productosStockBajo.map((producto) => (
                    <Card
                      key={producto.id}
                      className="border-destructive/30 bg-destructive/5"
                    >
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{producto.nombre}</p>
                            <p className="text-sm text-muted-foreground">
                              {producto.codigo_barras || "Sin código"}
                            </p>
                            <Badge
                              variant="outline"
                              className="mt-2"
                              style={{
                                borderColor: producto.categoria_color,
                                color: producto.categoria_color,
                              }}
                            >
                              {producto.categoria_nombre}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-destructive">
                              {producto.stock_actual}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              min: {producto.stock_minimo}
                            </p>
                          </div>
                        </div>
                        {puedeModificar && (
                          <Button
                            className="w-full mt-4"
                            size="sm"
                            onClick={() =>
                              handleOpenDialog(producto, "entrada")
                            }
                          >
                            <PackagePlus className="h-4 w-4 mr-2" />
                            Agregar Stock
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Movimientos */}
        <TabsContent value="movimientos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historial de Movimientos
              </CardTitle>
              <CardDescription>Últimos movimientos de inventario</CardDescription>
            </CardHeader>
            <CardContent>
              {movimientosRecientes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Sin movimientos registrados</p>
                  <p>Los movimientos de inventario aparecerán aquí</p>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-center">Cantidad</TableHead>
                        <TableHead className="text-center">
                          Stock Anterior
                        </TableHead>
                        <TableHead className="text-center">
                          Stock Nuevo
                        </TableHead>
                        <TableHead>Motivo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movimientosRecientes.map((movimiento) => (
                        <TableRow key={movimiento.id}>
                          <TableCell className="text-sm">
                            {format(new Date(movimiento.created_at), "dd/MM/yyyy HH:mm", {
                              locale: es,
                            })}
                          </TableCell>
                          <TableCell className="font-medium">
                            {movimiento.producto?.nombre || "Producto eliminado"}
                          </TableCell>
                          <TableCell>
                            {movimiento.tipo === "entrada" ? (
                              <Badge className="bg-primary text-primary-foreground">
                                <ArrowUpRight className="h-3 w-3 mr-1" />
                                Entrada
                              </Badge>
                            ) : movimiento.tipo === "salida" ? (
                              <Badge variant="destructive">
                                <ArrowDownRight className="h-3 w-3 mr-1" />
                                Salida
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Ajuste</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            {movimiento.tipo === "entrada" ? "+" : "-"}
                            {movimiento.cantidad}
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground">
                            {movimiento.stock_anterior}
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {movimiento.stock_nuevo}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                            {movimiento.motivo || "-"}
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

      {/* Dialogo para movimientos */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === "entrada"
                ? "Registrar Entrada de Stock"
                : dialogType === "salida"
                ? "Registrar Salida de Stock"
                : "Ajustar Stock"}
            </DialogTitle>
            <DialogDescription>
              {selectedProduct?.nombre} - Stock actual: {selectedProduct?.stock_actual}{" "}
              {selectedProduct?.unidad}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cantidad">Cantidad</Label>
              <Input
                id="cantidad"
                type="number"
                min="1"
                max={
                  dialogType === "salida"
                    ? selectedProduct?.stock_actual
                    : undefined
                }
                placeholder={
                  dialogType === "ajuste"
                    ? "Nuevo valor de stock"
                    : `Cantidad a ${
                        dialogType === "entrada" ? "agregar" : "retirar"
                      }`
                }
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                autoFocus
              />
              {dialogType === "salida" && selectedProduct && (
                <p className="text-sm text-muted-foreground">
                  Máximo disponible: {selectedProduct.stock_actual}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo (opcional)</Label>
              <Textarea
                id="motivo"
                placeholder="Describe el motivo del movimiento"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className={
                  dialogType === "entrada"
                    ? ""
                    : dialogType === "salida"
                    ? "bg-destructive hover:bg-destructive/90"
                    : ""
                }
              >
                {dialogType === "entrada" ? (
                  <>
                    <PackagePlus className="h-4 w-4 mr-2" />
                    Registrar Entrada
                  </>
                ) : dialogType === "salida" ? (
                  <>
                    <PackageMinus className="h-4 w-4 mr-2" />
                    Registrar Salida
                  </>
                ) : (
                  "Aplicar Ajuste"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}