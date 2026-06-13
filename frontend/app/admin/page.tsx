'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Navbar } from '@/components/navbar'
import { 
  FileText, 
  Download, 
  Printer, 
  Search, 
  RefreshCw, 
  Database, 
  Clock, 
  User, 
  Activity,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface AuditLog {
  id: number
  db_name: string
  usuario_responsable: string
  fecha_exacta: string
  tabla_afectada: string
  estado_anterior: string | null
  estado_nuevo: string | null
}

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDb, setSelectedDb] = useState('todos')
  const [selectedTable, setSelectedTable] = useState('todos')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/audit-logs')
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'No se pudieron obtener los logs de auditoría')
      }
      const data = await res.json()
      setLogs(data || [])
    } catch (err: any) {
      setError(err.message || 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.rol !== 'admin') {
        router.push('/browse')
      } else {
        fetchLogs()
      }
    }
  }, [user, authLoading, router])

  // Lista de bases de datos únicas para el filtro
  const dbs = useMemo(() => {
    const unique = new Set(logs.map(log => log.db_name))
    return ['todos', ...Array.from(unique)]
  }, [logs])

  // Lista de tablas únicas para el filtro
  const tables = useMemo(() => {
    const unique = new Set(logs.map(log => log.tabla_afectada))
    return ['todos', ...Array.from(unique)]
  }, [logs])

  // Logs filtrados
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.usuario_responsable.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.tabla_afectada.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.estado_nuevo && log.estado_nuevo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (log.estado_anterior && log.estado_anterior.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesDb = selectedDb === 'todos' || log.db_name === selectedDb
      const matchesTable = selectedTable === 'todos' || log.tabla_afectada === selectedTable

      return matchesSearch && matchesDb && matchesTable
    })
  }, [logs, searchQuery, selectedDb, selectedTable])

  // Paginación
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredLogs, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedDb, selectedTable])

  // Métricas
  const metrics = useMemo(() => {
    const total = filteredLogs.length
    const uniqueUsers = new Set(filteredLogs.map(log => log.usuario_responsable)).size
    
    let inserts = 0
    let updates = 0
    filteredLogs.forEach(log => {
      if (log.estado_anterior === null) {
        inserts++
      } else {
        updates++
      }
    })

    return { total, uniqueUsers, inserts, updates }
  }, [filteredLogs])

  // Exportar a CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return

    const headers = ['ID', 'Base de Datos', 'Usuario Responsable', 'Fecha', 'Tabla Afectada', 'Estado Anterior', 'Estado Nuevo']
    const rows = filteredLogs.map(log => [
      log.id,
      log.db_name,
      log.usuario_responsable,
      new Date(log.fecha_exacta).toLocaleString(),
      log.tabla_afectada,
      log.estado_anterior ? JSON.stringify(log.estado_anterior) : '',
      log.estado_nuevo ? JSON.stringify(log.estado_nuevo) : ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `reporte_auditoria_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Exportar a PDF (imprimir con CSS personalizado)
  const handleExportPDF = () => {
    window.print()
  }

  const toggleRow = (rowKey: string) => {
    setExpandedId(prev => prev === rowKey ? null : rowKey)
  }

  const formatJSON = (jsonStr: string | null) => {
    if (!jsonStr) return 'Ninguno'
    try {
      const parsed = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr
      return JSON.stringify(parsed, null, 2)
    } catch {
      return jsonStr
    }
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || user.rol !== 'admin') {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Acceso Denegado</h1>
          <p className="mt-2 text-muted-foreground">No tienes permisos para ver esta página.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-12">
      <Navbar />
      
      {/* Contenedor Principal */}
      <div className="mx-auto max-w-7xl px-4 pt-24 md:px-8 lg:px-16 print:pt-0">
        
        {/* Encabezado */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center border-b border-border pb-6 print:hidden">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Auditoría Interna Transaccional</h1>
            <p className="text-muted-foreground mt-1">Bitácora agregada de inserciones y actualizaciones en tiempo real.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" onClick={fetchLogs} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Sincronizar
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={filteredLogs.length === 0} className="gap-2">
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
            <Button variant="default" size="sm" onClick={handleExportPDF} disabled={filteredLogs.length === 0} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Printer className="h-4 w-4" />
              Descargar PDF
            </Button>
          </div>
        </div>

        {/* Encabezado especial para Imprimir PDF */}
        <div className="hidden print:block mb-8 text-black">
          <h1 className="text-2xl font-bold">Reporte de Auditoría Transaccional - Quetxal TV</h1>
          <p className="text-sm">Generado el: {new Date().toLocaleString()}</p>
          <p className="text-sm">Filtros aplicados - Base de Datos: {selectedDb}, Tabla: {selectedTable}, Búsqueda: {searchQuery || 'Ninguna'}</p>
          <hr className="mt-4 border-black" />
        </div>

        {/* Tarjetas de Métricas */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-8 print:grid-cols-4 print:mt-4">
          <Card className="bg-card/50 backdrop-blur-md border-border/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total de Eventos</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total}</div>
              <CardDescription className="text-xs text-muted-foreground mt-1">Eventos registrados</CardDescription>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-md border-border/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Responsables</CardTitle>
              <User className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.uniqueUsers}</div>
              <CardDescription className="text-xs text-muted-foreground mt-1">Usuarios/Procesos únicos</CardDescription>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-md border-border/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Inserciones (INSERT)</CardTitle>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10">Nuevos</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-500">{metrics.inserts}</div>
              <CardDescription className="text-xs text-muted-foreground mt-1">Registros creados</CardDescription>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-md border-border/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actualizaciones (UPDATE)</CardTitle>
              <Badge variant="outline" className="border-blue-500/30 text-blue-500 bg-blue-500/10">Modificaciones</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{metrics.updates}</div>
              <CardDescription className="text-xs text-muted-foreground mt-1">Registros modificados</CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="bg-card/30 backdrop-blur-md border border-border p-4 rounded-xl mt-6 flex flex-col gap-4 md:flex-row md:items-center print:hidden">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por correo responsable, tabla o datos..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50"
            />
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">BD:</span>
              <select
                value={selectedDb}
                onChange={e => setSelectedDb(e.target.value)}
                className="bg-background/80 border border-border text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {dbs.map(db => (
                  <option key={db} value={db}>
                    {db === 'todos' ? 'Todas las BD' : db.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Tabla:</span>
              <select
                value={selectedTable}
                onChange={e => setSelectedTable(e.target.value)}
                className="bg-background/80 border border-border text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {tables.map(tbl => (
                  <option key={tbl} value={tbl}>
                    {tbl === 'todos' ? 'Todas las tablas' : tbl}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de Resultados */}
        <div className="bg-card border border-border rounded-xl mt-6 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Consultando bases de datos relacionales...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20 px-4">
              <p className="text-destructive font-semibold">Error al cargar la bitácora</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchLogs} className="mt-4">Reintentar</Button>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              Ningún registro de auditoría coincide con los filtros aplicados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                    <th className="px-4 py-3 print:px-2">Fecha</th>
                    <th className="px-4 py-3 print:px-2">Origen (BD)</th>
                    <th className="px-4 py-3 print:px-2">Usuario Responsable</th>
                    <th className="px-4 py-3 print:px-2">Tabla</th>
                    <th className="px-4 py-3 print:px-2">Acción</th>
                    <th className="px-4 py-3 w-10 print:hidden"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {paginatedLogs.map((log, index) => {
                    const isInsert = log.estado_anterior === null
                    const uniqueRowKey = `${log.db_name ?? 'db'}_${log.id ?? index}`

                    return (
                      <React.Fragment key={uniqueRowKey}>
                        <tr 
                           onClick={() => toggleRow(uniqueRowKey)}
                          className="hover:bg-muted/20 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3 font-medium whitespace-nowrap print:px-2">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground print:hidden" />
                              {new Date(log.fecha_exacta).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-4 py-3 print:px-2">
                            <span className="font-semibold text-xs tracking-wider uppercase bg-muted px-2 py-0.5 rounded border border-border flex items-center gap-1 w-fit">
                              <Database className="h-3 w-3 text-muted-foreground" />
                              {log.db_name}
                            </span>
                          </td>
                          <td className="px-4 py-3 max-w-[200px] truncate font-mono text-xs print:px-2">
                            {log.usuario_responsable}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground print:px-2">
                            {log.tabla_afectada}
                          </td>
                          <td className="px-4 py-3 print:px-2">
                            {isInsert ? (
                              <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/15">
                                INSERT
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-500/15 text-blue-500 border-blue-500/30 hover:bg-blue-500/15">
                                UPDATE
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right print:hidden">
                            {expandedId === uniqueRowKey ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </td>
                        </tr>
                        
                        {/* Fila Expandida con Diffs */}
                        {expandedId === uniqueRowKey && (
                          <tr className="bg-muted/10 print:table-row">
                            <td colSpan={6} className="px-6 py-4 border-t border-border print:px-2 print:py-2">
                              <div className="grid gap-6 md:grid-cols-2 print:grid-cols-1 print:gap-2">
                                
                                {/* Estado Anterior */}
                                <div className="space-y-1.5">
                                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-destructive/60"></span>
                                    Estado Anterior
                                  </h4>
                                  <pre className="text-xs bg-black/40 border border-border p-3 rounded-lg overflow-x-auto max-h-60 font-mono text-foreground select-all whitespace-pre-wrap">
                                    {formatJSON(log.estado_anterior)}
                                  </pre>
                                </div>

                                {/* Estado Nuevo */}
                                <div className="space-y-1.5">
                                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500/60"></span>
                                    Estado Nuevo
                                  </h4>
                                  <pre className="text-xs bg-black/40 border border-border p-3 rounded-lg overflow-x-auto max-h-60 font-mono text-foreground select-all whitespace-pre-wrap">
                                    {formatJSON(log.estado_nuevo)}
                                  </pre>
                                </div>

                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paginación */}
        {filteredLogs.length > itemsPerPage && !loading && (
          <div className="flex items-center justify-between mt-6 print:hidden">
            <span className="text-xs text-muted-foreground">
              Mostrando {Math.min(filteredLogs.length, (currentPage - 1) * itemsPerPage + 1)}-
              {Math.min(filteredLogs.length, currentPage * itemsPerPage)} de {filteredLogs.length} registros
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
        
      </div>
    </div>
  )
}
