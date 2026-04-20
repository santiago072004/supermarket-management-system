"use client"

import { useState } from 'react'
import useSWR from 'swr'
import { useAuth } from '@/lib/auth-context'
import type { Usuario } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import {
  Users,
  Plus,
  Edit,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Mail,
  User,
  Lock,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface UsuarioFormData {
  nombre: string
  email: string
  password: string
  rol: Usuario['rol']
}

const initialFormData: UsuarioFormData = {
  nombre: '',
  email: '',
  password: '',
  rol: 'cajero',
}

const rolIcons = {
  admin: ShieldCheck,
  cajero: Shield,
  inventario: ShieldAlert,
}

const rolLabels = {
  admin: 'Administrador',
  cajero: 'Cajero',
  inventario: 'Inventario',
}

const rolColors = {
  admin: 'bg-primary text-primary-foreground',
  cajero: 'bg-accent text-accent-foreground',
  inventario: 'bg-secondary text-secondary-foreground',
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function UsuariosPage() {
  const { tienePermiso, user } = useAuth()
  const { data: usuarios = [], isLoading, mutate } = useSWR<Usuario[]>('/api/usuarios', fetcher)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [formData, setFormData] = useState<UsuarioFormData>(initialFormData)
  const [saving, setSaving] = useState(false)

  const puedeCrear = tienePermiso('usuarios', 'crear')
  const puedeEditar = tienePermiso('usuarios', 'editar')
  const puedeVer = tienePermiso('usuarios', 'ver')

  // Función para eliminar usuario
  const handleDeleteUsuario = async (usuario: Usuario) => {
    if (usuario.id === user?.id) {
      toast.error('No puedes eliminar tu propio usuario');
      return;
    }
    if (!confirm(`¿Estás seguro de eliminar a "${usuario.nombre}"?`)) return;

    try {
      const resp = await fetch(`/api/usuarios/${usuario.id}`, { method: 'DELETE' });
      const result = await resp.json();
      if (resp.ok) {
        toast.success('Usuario eliminado correctamente');
        mutate();
      } else {
        toast.error(result.error || 'Error al eliminar usuario');
      }
    } catch {
      toast.error('Error de conexión al eliminar usuario');
    }
  };

  if (!puedeVer) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Usuarios
          </h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Sin permisos</p>
              <p>No tienes permisos para ver esta sección</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleOpenDialog = (usuario?: Usuario) => {
    if (usuario) {
      setEditingUser(usuario)
      setFormData({
        nombre: usuario.nombre,
        email: usuario.email,
        password: '',
        rol: usuario.rol,
      })
    } else {
      setEditingUser(null)
      setFormData(initialFormData)
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingUser(null)
    setFormData(initialFormData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre || !formData.email) {
      toast.error('Por favor completa los campos obligatorios')
      return
    }
    if (!editingUser && !formData.password) {
      toast.error('La contraseña es obligatoria para nuevos usuarios')
      return
    }
    setSaving(true)
    try {
      if (editingUser) {
        const resp = await fetch(`/api/usuarios/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: formData.nombre,
            email: formData.email,
            password: formData.password || undefined,
            rol: formData.rol
          })
        })
        const result = await resp.json()
        if (resp.ok) {
          toast.success('Usuario editado correctamente')
          mutate()
          handleCloseDialog()
        } else {
          toast.error(result.error || 'Error al editar usuario')
        }
      } else {
        // CREAR NUEVO USUARIO
        const resp = await fetch('/api/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        const result = await resp.json()
        if (resp.ok) {
          toast.success('Usuario creado correctamente')
          mutate()
          handleCloseDialog()
        } else {
          toast.error(result.error || 'Error al crear usuario')
        }
      }
    } catch (err) {
      toast.error('Error de conexión')
    }
    setSaving(false)
  }

  const handleToggleActivo = async (usuario: Usuario) => {
    if (usuario.id === user?.id) {
      toast.error('No puedes desactivar tu propio usuario')
      return
    }
    const nuevoEstado = usuario.activo ? 0 : 1
    const resp = await fetch(`/api/usuarios`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: usuario.id, activo: nuevoEstado }),
    })
    if (resp.ok) {
      toast.success(nuevoEstado ? 'Usuario activado' : 'Usuario desactivado')
      mutate()
    } else {
      toast.error('Error al cambiar el estado del usuario')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Usuarios
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los usuarios del sistema
          </p>
        </div>
        {puedeCrear && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </DialogTitle>
                <DialogDescription>
                  {editingUser
                    ? 'Modifica los datos del usuario'
                    : 'Completa los datos para crear un nuevo usuario'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre Completo *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="nombre"
                      placeholder="Nombre del usuario"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    Contraseña {editingUser ? '(dejar vacío para mantener)' : '*'}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder={editingUser ? 'Nueva contraseña' : 'Contraseña'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10"
                      required={!editingUser}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rol">Rol *</Label>
                  <Select
                    value={formData.rol}
                    onValueChange={(value) => setFormData({ ...formData, rol: value as Usuario['rol'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4" />
                          Administrador
                        </div>
                      </SelectItem>
                      <SelectItem value="cajero">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Cajero
                        </div>
                      </SelectItem>
                      <SelectItem value="inventario">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="h-4 w-4" />
                          Inventario
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={saving}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving || (!editingUser && !formData.password)}>
                    {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Lista de Usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Sistema</CardTitle>
          <CardDescription>{usuarios.length} usuarios registrados</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ?
            <div className="py-8 text-center">Cargando...</div>
            : <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Correo Electrónico</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha de Registro</TableHead>
                    {puedeEditar && <TableHead className="text-right">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.map((usuario) => {
                    const RolIcon = rolIcons[usuario.rol]
                    return (
                      <TableRow key={usuario.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{usuario.nombre}</p>
                              {usuario.id === user?.id && (
                                <Badge variant="outline" className="text-xs">Tú</Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{usuario.email}</TableCell>
                        <TableCell>
                          <Badge className={rolColors[usuario.rol]}>
                            <RolIcon className="h-3 w-3 mr-1" />
                            {rolLabels[usuario.rol]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {usuario.activo ? (
                            <Badge className="bg-primary text-primary-foreground">Activo</Badge>
                          ) : (
                            <Badge variant="secondary">Inactivo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {usuario.created_at
                            ? format(new Date(usuario.created_at), "dd 'de' MMMM, yyyy", { locale: es })
                            : '-'}
                        </TableCell>
                        {puedeEditar && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(usuario)}
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleActivo(usuario)}
                                disabled={usuario.id === user?.id}
                              >
                                {usuario.activo ? 'Desactivar' : 'Activar'}
                              </Button>
                              {/* BOTÓN DE ELIMINAR */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUsuario(usuario)}
                                className="text-destructive hover:text-destructive"
                                disabled={usuario.id === user?.id}
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Eliminar</span>
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          }
        </CardContent>
      </Card>

      {/* Info de Roles */}
      <Card>
        <CardHeader>
          <CardTitle>Permisos por Rol</CardTitle>
          <CardDescription>Descripción de los permisos de cada rol</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Administrador</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Acceso completo a todas las funciones del sistema: productos, inventario, ventas, reportes, usuarios y configuración.
              </p>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-accent" />
                <h3 className="font-semibold">Cajero</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Puede ver productos y realizar ventas. Acceso limitado al punto de venta y visualización básica del inventario.
              </p>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="h-5 w-5 text-secondary-foreground" />
                <h3 className="font-semibold">Inventario</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Gestión de productos e inventario. Puede crear, editar y controlar el stock de productos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}