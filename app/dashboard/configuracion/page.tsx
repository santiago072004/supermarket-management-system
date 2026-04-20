"use client"

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Settings,
  Building2,
  Database,
  Shield,
  Bell,
  Palette,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  Edit,
  Tags,
  Truck,
} from 'lucide-react'
import { toast } from 'sonner'

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface Categoria {
  id: number
  nombre: string
  descripcion?: string
  color: string
  activa: boolean
  total_productos?: number
}

interface Proveedor {
  id: number
  nombre: string
  contacto?: string
  telefono?: string
  email?: string
  direccion?: string
  activo: boolean
  total_productos?: number
}

interface ConfigData {
  nombre_negocio: string
  direccion: string
  telefono: string
  email: string
  moneda: string
  impuesto_porcentaje: string
  ticket_mensaje: string
}

export default function ConfiguracionPage() {
  const { tienePermiso } = useAuth()
  const puedeEditar = tienePermiso('configuracion', 'editar')

  const [configData, setConfigData] = useState<ConfigData>({
    nombre_negocio: 'SuperMarket Pro',
    direccion: '',
    telefono: '',
    email: '',
    moneda: 'MXN',
    impuesto_porcentaje: '0',
    ticket_mensaje: 'Gracias por su compra!',
  })
  const [isSaving, setIsSaving] = useState(false)

  // Categorias
  const { data: categorias, mutate: mutateCategorias, isLoading: loadingCategorias } = useSWR<Categoria[]>(
    '/api/categorias',
    fetcher
  )
  const [showCategoriaDialog, setShowCategoriaDialog] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null)
  const [categoriaForm, setCategoriaForm] = useState({ nombre: '', descripcion: '', color: '#6366f1' })

  // Proveedores
  const { data: proveedores, mutate: mutateProveedores, isLoading: loadingProveedores } = useSWR<Proveedor[]>(
    '/api/proveedores',
    fetcher
  )
  const [showProveedorDialog, setShowProveedorDialog] = useState(false)
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null)
  const [proveedorForm, setProveedorForm] = useState({
    nombre: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
  })

  // Cargar configuracion
  const { data: config, isLoading: loadingConfig } = useSWR<Record<string, string>>(
    '/api/configuracion',
    fetcher
  )

  useEffect(() => {
    if (config) {
      setConfigData({
        nombre_negocio: config.nombre_negocio || 'SuperMarket Pro',
        direccion: config.direccion || '',
        telefono: config.telefono || '',
        email: config.email || '',
        moneda: config.moneda || 'MXN',
        impuesto_porcentaje: config.impuesto_porcentaje || '0',
        ticket_mensaje: config.ticket_mensaje || 'Gracias por su compra!',
      })
    }
  }, [config])

  const handleSaveConfig = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/configuracion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData),
      })

      if (!response.ok) {
        throw new Error('Error al guardar configuracion')
      }

      toast.success('Configuracion guardada correctamente')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  // Categoria handlers
  const handleOpenCategoriaDialog = (categoria?: Categoria) => {
    if (categoria) {
      setEditingCategoria(categoria)
      setCategoriaForm({
        nombre: categoria.nombre,
        descripcion: categoria.descripcion || '',
        color: categoria.color,
      })
    } else {
      setEditingCategoria(null)
      setCategoriaForm({ nombre: '', descripcion: '', color: '#6366f1' })
    }
    setShowCategoriaDialog(true)
  }

  const handleSaveCategoria = async () => {
    if (!categoriaForm.nombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    try {
      const response = await fetch('/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoriaForm),
      })

      if (!response.ok) {
        throw new Error('Error al guardar categoria')
      }

      toast.success(editingCategoria ? 'Categoria actualizada' : 'Categoria creada')
      mutateCategorias()
      setShowCategoriaDialog(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar')
    }
  }

  // Proveedor handlers
  const handleOpenProveedorDialog = (proveedor?: Proveedor) => {
    if (proveedor) {
      setEditingProveedor(proveedor)
      setProveedorForm({
        nombre: proveedor.nombre,
        contacto: proveedor.contacto || '',
        telefono: proveedor.telefono || '',
        email: proveedor.email || '',
        direccion: proveedor.direccion || '',
      })
    } else {
      setEditingProveedor(null)
      setProveedorForm({ nombre: '', contacto: '', telefono: '', email: '', direccion: '' })
    }
    setShowProveedorDialog(true)
  }

  const handleSaveProveedor = async () => {
    if (!proveedorForm.nombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    try {
      const response = await fetch('/api/proveedores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proveedorForm),
      })

      if (!response.ok) {
        throw new Error('Error al guardar proveedor')
      }

      toast.success(editingProveedor ? 'Proveedor actualizado' : 'Proveedor creado')
      mutateProveedores()
      setShowProveedorDialog(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar')
    }
  }

  if (!puedeEditar) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">Acceso Restringido</h2>
          <p className="text-muted-foreground">
            No tienes permisos para acceder a la configuracion
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            Configuracion
          </h1>
          <p className="text-muted-foreground mt-1">
            Administra la configuracion del sistema
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="categorias" className="flex items-center gap-2">
            <Tags className="h-4 w-4" />
            <span className="hidden sm:inline">Categorias</span>
          </TabsTrigger>
          <TabsTrigger value="proveedores" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            <span className="hidden sm:inline">Proveedores</span>
          </TabsTrigger>
          <TabsTrigger value="sistema" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Sistema</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab General */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informacion del Negocio
              </CardTitle>
              <CardDescription>
                Configura los datos basicos de tu negocio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingConfig ? (
                <div className="text-center py-8">
                  <Spinner className="h-8 w-8 mx-auto" />
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="nombre_negocio">Nombre del Negocio</Label>
                      <Input
                        id="nombre_negocio"
                        value={configData.nombre_negocio}
                        onChange={(e) => setConfigData({ ...configData, nombre_negocio: e.target.value })}
                        placeholder="Mi Supermercado"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefono">Telefono</Label>
                      <Input
                        id="telefono"
                        value={configData.telefono}
                        onChange={(e) => setConfigData({ ...configData, telefono: e.target.value })}
                        placeholder="555-0100"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="direccion">Direccion</Label>
                    <Input
                      id="direccion"
                      value={configData.direccion}
                      onChange={(e) => setConfigData({ ...configData, direccion: e.target.value })}
                      placeholder="Calle Principal #123"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={configData.email}
                        onChange={(e) => setConfigData({ ...configData, email: e.target.value })}
                        placeholder="contacto@ejemplo.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="moneda">Moneda</Label>
                      <Select
                        value={configData.moneda}
                        onValueChange={(value) => setConfigData({ ...configData, moneda: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                          <SelectItem value="USD">USD - Dolar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="ticket_mensaje">Mensaje en Ticket</Label>
                    <Textarea
                      id="ticket_mensaje"
                      value={configData.ticket_mensaje}
                      onChange={(e) => setConfigData({ ...configData, ticket_mensaje: e.target.value })}
                      placeholder="Gracias por su compra!"
                      rows={3}
                    />
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveConfig} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Spinner className="h-4 w-4 mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Tab Categorias */}
        <TabsContent value="categorias" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Tags className="h-5 w-5" />
                    Categorias de Productos
                  </CardTitle>
                  <CardDescription>
                    Administra las categorias de productos
                  </CardDescription>
                </div>
                <Button onClick={() => handleOpenCategoriaDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Categoria
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingCategorias ? (
                <div className="text-center py-8">
                  <Spinner className="h-8 w-8 mx-auto" />
                </div>
              ) : !categorias || categorias.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Tags className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay categorias registradas</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Color</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Descripcion</TableHead>
                        <TableHead className="text-center">Productos</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categorias.map((cat) => (
                        <TableRow key={cat.id}>
                          <TableCell>
                            <div
                              className="w-6 h-6 rounded-full border"
                              style={{ backgroundColor: cat.color }}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{cat.nombre}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {cat.descripcion || '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{cat.total_productos || 0}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={cat.activa ? 'default' : 'destructive'}>
                              {cat.activa ? 'Activa' : 'Inactiva'}
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

        {/* Tab Proveedores */}
        <TabsContent value="proveedores" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Proveedores
                  </CardTitle>
                  <CardDescription>
                    Administra los proveedores de productos
                  </CardDescription>
                </div>
                <Button onClick={() => handleOpenProveedorDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Proveedor
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingProveedores ? (
                <div className="text-center py-8">
                  <Spinner className="h-8 w-8 mx-auto" />
                </div>
              ) : !proveedores || proveedores.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay proveedores registrados</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead>Telefono</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-center">Productos</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {proveedores.map((prov) => (
                        <TableRow key={prov.id}>
                          <TableCell className="font-medium">{prov.nombre}</TableCell>
                          <TableCell>{prov.contacto || '-'}</TableCell>
                          <TableCell>{prov.telefono || '-'}</TableCell>
                          <TableCell>{prov.email || '-'}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{prov.total_productos || 0}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={prov.activo ? 'default' : 'destructive'}>
                              {prov.activo ? 'Activo' : 'Inactivo'}
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

        {/* Tab Sistema */}
        <TabsContent value="sistema" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Estado del Sistema
              </CardTitle>
              <CardDescription>
                Informacion sobre la conexion y estado de la base de datos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">Base de Datos</p>
                      <p className="text-sm text-muted-foreground">MySQL / XAMPP</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">Servidor Web</p>
                      <p className="text-sm text-muted-foreground">Next.js</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Variables de Entorno</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between p-2 rounded bg-muted">
                    <span className="font-mono">DB_HOST</span>
                    <Badge variant="outline">localhost</Badge>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted">
                    <span className="font-mono">DB_PORT</span>
                    <Badge variant="outline">3306</Badge>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted">
                    <span className="font-mono">DB_NAME</span>
                    <Badge variant="outline">supermercado_db</Badge>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted">
                    <span className="font-mono">DB_USER</span>
                    <Badge variant="outline">root</Badge>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-accent/50 border border-accent">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-accent-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-accent-foreground">Importante</p>
                    <p className="text-sm text-muted-foreground">
                      Asegurate de que XAMPP este ejecutandose con Apache y MySQL activos
                      para que el sistema funcione correctamente.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Categoria */}
      <Dialog open={showCategoriaDialog} onOpenChange={setShowCategoriaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategoria ? 'Editar Categoria' : 'Nueva Categoria'}
            </DialogTitle>
            <DialogDescription>
              {editingCategoria ? 'Modifica los datos de la categoria' : 'Agrega una nueva categoria de productos'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cat_nombre">Nombre *</Label>
              <Input
                id="cat_nombre"
                value={categoriaForm.nombre}
                onChange={(e) => setCategoriaForm({ ...categoriaForm, nombre: e.target.value })}
                placeholder="Nombre de la categoria"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat_descripcion">Descripcion</Label>
              <Textarea
                id="cat_descripcion"
                value={categoriaForm.descripcion}
                onChange={(e) => setCategoriaForm({ ...categoriaForm, descripcion: e.target.value })}
                placeholder="Descripcion de la categoria"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat_color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="cat_color"
                  type="color"
                  value={categoriaForm.color}
                  onChange={(e) => setCategoriaForm({ ...categoriaForm, color: e.target.value })}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={categoriaForm.color}
                  onChange={(e) => setCategoriaForm({ ...categoriaForm, color: e.target.value })}
                  placeholder="#6366f1"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoriaDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCategoria}>
              {editingCategoria ? 'Guardar Cambios' : 'Crear Categoria'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Proveedor */}
      <Dialog open={showProveedorDialog} onOpenChange={setShowProveedorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </DialogTitle>
            <DialogDescription>
              {editingProveedor ? 'Modifica los datos del proveedor' : 'Agrega un nuevo proveedor'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="prov_nombre">Nombre *</Label>
              <Input
                id="prov_nombre"
                value={proveedorForm.nombre}
                onChange={(e) => setProveedorForm({ ...proveedorForm, nombre: e.target.value })}
                placeholder="Nombre del proveedor"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="prov_contacto">Contacto</Label>
                <Input
                  id="prov_contacto"
                  value={proveedorForm.contacto}
                  onChange={(e) => setProveedorForm({ ...proveedorForm, contacto: e.target.value })}
                  placeholder="Persona de contacto"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prov_telefono">Telefono</Label>
                <Input
                  id="prov_telefono"
                  value={proveedorForm.telefono}
                  onChange={(e) => setProveedorForm({ ...proveedorForm, telefono: e.target.value })}
                  placeholder="555-0100"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prov_email">Email</Label>
              <Input
                id="prov_email"
                type="email"
                value={proveedorForm.email}
                onChange={(e) => setProveedorForm({ ...proveedorForm, email: e.target.value })}
                placeholder="contacto@proveedor.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prov_direccion">Direccion</Label>
              <Textarea
                id="prov_direccion"
                value={proveedorForm.direccion}
                onChange={(e) => setProveedorForm({ ...proveedorForm, direccion: e.target.value })}
                placeholder="Direccion del proveedor"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProveedorDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProveedor}>
              {editingProveedor ? 'Guardar Cambios' : 'Crear Proveedor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
