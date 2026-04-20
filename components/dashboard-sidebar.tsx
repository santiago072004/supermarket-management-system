"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  BarChart3,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Store,
} from 'lucide-react'
import { useState } from 'react'

const menuItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', modulo: 'dashboard' as const },
  { href: '/dashboard/productos', icon: Package, label: 'Productos', modulo: 'productos' as const },
  { href: '/dashboard/inventario', icon: Warehouse, label: 'Inventario', modulo: 'inventario' as const },
  { href: '/dashboard/ventas', icon: ShoppingCart, label: 'Ventas', modulo: 'ventas' as const },
  { href: '/dashboard/reportes', icon: BarChart3, label: 'Reportes', modulo: 'reportes' as const },
  { href: '/dashboard/usuarios', icon: Users, label: 'Usuarios', modulo: 'usuarios' as const },
  { href: '/dashboard/configuracion', icon: Settings, label: 'Configuración', modulo: 'configuracion' as const },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, tienePermiso } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const filteredMenuItems = menuItems.filter(item => tienePermiso(item.modulo, 'ver'))

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 z-50",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Store className="w-8 h-8 text-sidebar-primary" />
            <span className="font-bold text-lg">SuperMarket</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Menú de navegación */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    collapsed && "justify-center"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="font-medium">{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Usuario y logout */}
      <div className="p-4 border-t border-sidebar-border">
        {!collapsed && user && (
          <div className="mb-3">
            <p className="font-medium truncate">{user.nombre}</p>
            <p className="text-sm text-sidebar-foreground/70 capitalize">{user.rol}</p>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed ? "px-0 justify-center" : "justify-start"
          )}
          title={collapsed ? "Cerrar sesión" : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="ml-2">Cerrar sesión</span>}
        </Button>
      </div>
    </aside>
  )
}
