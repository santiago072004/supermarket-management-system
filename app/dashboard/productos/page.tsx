"use client"

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { useAuth } from '@/lib/auth-context'
import type { Producto } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Package,
  Plus,
  Search,
  Edit,
  Barcode,
  Filter,
  RefreshCw,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

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
  proveedor_nombre?: string
}

interface Categoria {
  id: number
  nombre: string
  color: string
  total_productos?: number
}

interface Proveedor {
  id: number
  nombre: string
}

interface ProductoFormData {
  codigo_barras: string
  nombre: string
  descripcion: string
  categoria_id: string
  proveedor_id: string
  precio_compra: string
  precio_venta: string
  stock_actual: string
  stock_minimo: string
  unidad: string
}

const initialFormData: ProductoFormData = {
  codigo_barras: '',
  nombre: '',
  descripcion: '',
  categoria_id: '',
  proveedor_id: '',
  precio_compra: '',
  precio_venta: '',
  stock_actual: '0',
  stock_minimo: '10',
  unidad: 'unidad',
}

export default function ProductosPage() {
  const { tienePermiso } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductoAPI | null>(null)
  const [formData, setFormData] = useState<ProductoFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: productosData, error, isLoading, mutate } = useSWR(
  '/api/productos',
  fetcher
  )
  const productos: ProductoAPI[] = productosData?.productos || []

  const { data: categorias } = useSWR<Categoria[]>('/api/categorias', fetcher)
  const { data: proveedores } = useSWR<Proveedor[]>('/api/proveedores', fetcher)

  const puedeCrear = tienePermiso('productos', 'crear')
  const puedeEditar = tienePermiso('productos', 'editar')
  const puedeEliminar = tienePermiso('productos', 'eliminar')

  const productosFiltrados = useMemo(() => {
    if (!productos) return []
    return productos.filter((producto) => {
      const matchSearch =
        producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.codigo_barras?.includes(searchTerm) ||
        producto.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchCategoria =
        categoriaFilter === 'all' || producto.categoria_id?.toString() === categoriaFilter

      return matchSearch && matchCategoria
    })
  }, [productos, searchTerm, categoriaFilter])

  const handleOpenDialog = (producto?: ProductoAPI) => {
    if (producto) {
      setEditingProduct(producto)
      setFormData({
        codigo_barras: producto.codigo_barras || '',
        nombre: producto.nombre,
        descripcion: producto.descripcion || '',
        categoria_id: producto.categoria_id?.toString() || '',
        proveedor_id: producto.proveedor_id?.toString() || '',
        precio_compra: producto.precio_compra.toString(),
        precio_venta: producto.precio_venta.toString(),
        stock_actual: producto.stock_actual.toString(),
        stock_minimo: producto.stock_minimo.toString(),
        unidad: producto.unidad,
      })
    } else {
      setEditingProduct(null)
      setFormData(initialFormData)
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingProduct(null)
    setFormData(initialFormData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre || !formData.precio_venta) {
      toast.error('Por favor completa los campos obligatorios')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        codigo_barras: formData.codigo_barras || null,
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        categoria_id: formData.categoria_id ? parseInt(formData.categoria_id) : null,
        proveedor_id: formData.proveedor_id ? parseInt(formData.proveedor_id) : null,
        precio_compra: parseFloat(formData.precio_compra) || 0,
        precio_venta: parseFloat(formData.precio_venta),
        stock_actual: parseInt(formData.stock_actual) || 0,
        stock_minimo: parseInt(formData.stock_minimo) || 10,
        unidad: formData.unidad,
      }

      const url = editingProduct 
        ? `/api/productos/${editingProduct.id}` 
        : '/api/productos'
      
      const method = editingProduct ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al guardar producto')
      }

      toast.success(editingProduct ? 'Producto actualizado correctamente' : 'Producto creado correctamente')
      mutate()
      handleCloseDialog()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar producto')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (producto: ProductoAPI) => {
    if (!confirm(`Estas seguro de eliminar "${producto.nombre}"?`)) return

    try {
      const response = await fetch(`/api/productos/${producto.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Error al eliminar producto')
      }

      toast.success('Producto eliminado correctamente')
      mutate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar producto')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner className="h-8 w-8 mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando productos...</p>
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
            No se pudo conectar con la base de datos.
          </p>
          <Button onClick={() => mutate()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            Productos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona el catalogo de productos del supermercado
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          {puedeCrear && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Producto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingProduct
                      ? 'Modifica los datos del producto'
                      : 'Completa los datos para registrar un nuevo producto'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="codigo_barras">Codigo de Barras</Label>
                      <div className="relative">
                        <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="codigo_barras"
                          placeholder="7501000111111"
                          value={formData.codigo_barras}
                          onChange={(e) =>
                            setFormData({ ...formData, codigo_barras: e.target.value })
                          }
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre *</Label>
                      <Input
                        id="nombre"
                        placeholder="Nombre del producto"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripcion</Label>
                    <Textarea
                      id="descripcion"
                      placeholder="Descripcion del producto"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="categoria">Categoria</Label>
                      <Select
                        value={formData.categoria_id}
                        onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categorias?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="proveedor">Proveedor</Label>
                    <Select
                      value={formData.proveedor_id}
                      onValueChange={(value) => setFormData({ ...formData, proveedor_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {(proveedores ?? []).map((prov) =>
                          prov && prov.id != null ? (
                            <SelectItem key={prov.id} value={prov.id.toString()}>
                              {prov.nombre}
                            </SelectItem>
                          ) : null
                        )}
                      </SelectContent>
                    </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="precio_compra">Precio de Compra</Label>
                      <Input
                        id="precio_compra"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.precio_compra}
                        onChange={(e) =>
                          setFormData({ ...formData, precio_compra: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="precio_venta">Precio de Venta *</Label>
                      <Input
                        id="precio_venta"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.precio_venta}
                        onChange={(e) =>
                          setFormData({ ...formData, precio_venta: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stock_actual">Stock Actual</Label>
                      <Input
                        id="stock_actual"
                        type="number"
                        min="0"
                        value={formData.stock_actual}
                        onChange={(e) =>
                          setFormData({ ...formData, stock_actual: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock_minimo">Stock Minimo</Label>
                      <Input
                        id="stock_minimo"
                        type="number"
                        min="0"
                        value={formData.stock_minimo}
                        onChange={(e) =>
                          setFormData({ ...formData, stock_minimo: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unidad">Unidad</Label>
                      <Select
                        value={formData.unidad}
                        onValueChange={(value) => setFormData({ ...formData, unidad: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unidad">Unidad</SelectItem>
                          <SelectItem value="kg">Kilogramo</SelectItem>
                          <SelectItem value="litro">Litro</SelectItem>
                          <SelectItem value="paquete">Paquete</SelectItem>
                          <SelectItem value="caja">Caja</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Spinner className="h-4 w-4 mr-2" />
                          Guardando...
                        </>
                      ) : (
                        editingProduct ? 'Guardar Cambios' : 'Crear Producto'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, codigo o descripcion..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorias</SelectItem>
                  {categorias?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Productos */}
      <Card>
        <CardHeader>
          <CardTitle>Catalogo de Productos</CardTitle>
          <CardDescription>
            {productosFiltrados.length} productos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">P. Compra</TableHead>
                  <TableHead className="text-right">P. Venta</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  {(puedeEditar || puedeEliminar) && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {productosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={(puedeEditar || puedeEliminar) ? 8 : 7} className="h-32 text-center">
                      <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                      <p className="text-muted-foreground">No se encontraron productos</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  productosFiltrados.map((producto) => (
                    <TableRow key={producto.id}>
                      <TableCell className="font-mono text-sm">
                        {producto.codigo_barras || '-'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{producto.nombre}</p>
                          {producto.descripcion && (
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {producto.descripcion}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {producto.categoria_nombre ? (
                          <Badge
                            variant="outline"
                            style={{ 
                              borderColor: producto.categoria_color, 
                              color: producto.categoria_color 
                            }}
                          >
                            {producto.categoria_nombre}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(producto.precio_compra)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(producto.precio_venta)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={
                            producto.stock_actual <= producto.stock_minimo
                              ? 'text-destructive font-bold'
                              : ''
                          }
                        >
                          {producto.stock_actual}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {' '}
                          / {producto.stock_minimo} {producto.unidad}
                        </span>
                      </TableCell>
                      <TableCell>
                        {producto.stock_actual <= producto.stock_minimo ? (
                          <Badge variant="destructive">Stock Bajo</Badge>
                        ) : (
                          <Badge variant="secondary">Normal</Badge>
                        )}
                      </TableCell>
                      {(puedeEditar || puedeEliminar) && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {puedeEditar && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(producto)}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Editar</span>
                              </Button>
                            )}
                            {puedeEliminar && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(producto)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Eliminar</span>
                              </Button>
                            )}
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
    </div>
  )
}
