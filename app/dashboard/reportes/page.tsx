"use client"
import useSWR from "swr"
import { useState } from "react"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { BarChart3, DollarSign, ShoppingCart, AlertTriangle, Download } from "lucide-react"

const fetcher = url => fetch(url).then(res => res.json())
function hoyISO() { return new Date().toISOString().slice(0, 10) }
function haceDiasISO(dias) { const d = new Date(); d.setDate(d.getDate() - dias); return d.toISOString().slice(0, 10) }
function formatCurrency(value) { return new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN"}).format(Number(value ?? 0)) }

export default function ReportesPage() {
  const [periodo, setPeriodo] = useState(30)
  const inicio = haceDiasISO(periodo)
  const fin = hoyISO()

  // CONSULTA REPORTES REALES
  const { data: repVentas, isLoading: loadingVentas } = useSWR(
    `/api/reportes?tipo=ventas&fechaInicio=${inicio}&fechaFin=${fin}`, fetcher
  )
  const { data: repProductos } = useSWR(
    `/api/reportes?tipo=productos&fechaInicio=${inicio}&fechaFin=${fin}`, fetcher
  )
  const { data: repInventario } = useSWR("/api/reportes?tipo=inventario", fetcher)

  function exportarCSV() {
    if (!repVentas?.ventasPorDia) return
    const csv = [
      "Fecha,Ventas,Ingresos",
      ...repVentas.ventasPorDia.map(v =>
        [v.fecha, v.total_ventas, v.total_ingresos].join(",")
      ),
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `ventas_${inicio}_a_${fin}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  if (loadingVentas || !repVentas) return <div className="p-4">Cargando reportes…</div>

  // DATA REAL
  const stats = repVentas.resumen || {}
  const ventasPorDia = repVentas.ventasPorDia || []
  const productosMasVendidos = repProductos?.masVendidos || []
  const resumenInventario = repInventario?.resumen || {}
  const productosStockBajo = repInventario?.stockBajo || []

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Reportes y Análisis
          </h1>
          <p className="text-muted-foreground mt-1">Todo viene de tu base de datos.</p>
        </div>
        <Button variant="outline" onClick={exportarCSV}>
          <Download className="h-4 w-4 mr-2" /> Exportar ventas CSV
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ventas periodo</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_ventas}</div>
            <p className="text-xs text-muted-foreground">{periodo} días</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total_ingresos)}</div>
            <p className="text-xs text-muted-foreground">Suma total MXN</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ticket promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.ticket_promedio)}</div>
            <p className="text-xs text-muted-foreground">Venta media</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alerta stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{productosStockBajo.length}</div>
            <p className="text-xs text-muted-foreground">Productos bajo mínimo</p>
          </CardContent>
        </Card>
      </div>

      {/* VENTAS POR DIA */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Ventas por Día</CardTitle>
            <CardDescription>Histórico del periodo consultado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Ventas</TableHead>
                    <TableHead>Ingresos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ventasPorDia.map(v => (
                    <TableRow key={v.fecha}>
                      <TableCell>{v.fecha}</TableCell>
                      <TableCell>{v.total_ventas}</TableCell>
                      <TableCell>{formatCurrency(v.total_ingresos)}</TableCell>
                    </TableRow>
                  ))}
                  {ventasPorDia.length === 0 &&
                    <TableRow><TableCell colSpan={3} className="text-center">Sin ventas</TableCell></TableRow>
                  }
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MÁS VENDIDOS */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Productos más vendidos</CardTitle>
            <CardDescription>Tu top 20 de productos en ventas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Cant. vendida</TableHead>
                    <TableHead>Ingresos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productosMasVendidos.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>{p.codigo_barras || "-"}</TableCell>
                      <TableCell>{p.nombre}</TableCell>
                      <TableCell>{p.categoria || "-"}</TableCell>
                      <TableCell>{p.total_vendido}</TableCell>
                      <TableCell>{formatCurrency(p.total_ingresos)}</TableCell>
                    </TableRow>
                  ))}
                  {productosMasVendidos.length === 0 &&
                    <TableRow><TableCell colSpan={5} className="text-center">Sin datos</TableCell></TableRow>
                  }
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* INVENTARIO RESUMEN */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Estado Inventario</CardTitle>
          </CardHeader>
          <CardContent>
            <div>Total productos activos: <b>{resumenInventario.total_productos ?? "0"}</b></div>
            <div>Unidades totales en stock: <b>{resumenInventario.total_unidades ?? "0"}</b></div>
            <div>Valor inventario (compra): <b>{formatCurrency(resumenInventario.valor_inventario_compra)}</b></div>
            <div>Valor inventario (venta): <b>{formatCurrency(resumenInventario.valor_inventario_venta)}</b></div>
          </CardContent>
        </Card>
      </div>

      {/* STOCK BAJO */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Productos con stock bajo</CardTitle>
          </CardHeader>
          <CardContent>
            {productosStockBajo.length === 0
              ? <span className="text-muted-foreground">No hay productos bajo mínimo</span>
              : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Stock mínimo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productosStockBajo.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>{p.nombre}</TableCell>
                        <TableCell>{p.stock_actual}</TableCell>
                        <TableCell>{p.stock_minimo}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            }
          </CardContent>
        </Card>
      </div>
    </div>
  )
}