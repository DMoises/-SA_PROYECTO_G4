'use client'

import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type AuditLog = {
  id: number
  db_name: string
  usuario_responsable: string
  fecha_exacta: string
  tabla_afectada: string
  estado_anterior: string | null
  estado_nuevo: string | null
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/admin/audit-logs')
        if (!res.ok) {
          throw new Error('No se pudieron cargar los logs de auditoría')
        }
        const data = await res.json()
        setLogs(Array.isArray(data) ? data : [])
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [])

  const handleExportCSV = () => {
    if (logs.length === 0) return

    const headers = ['ID', 'Base de Datos', 'Usuario Responsable', 'Fecha', 'Tabla Afectada', 'Estado Anterior', 'Estado Nuevo']
    const csvRows = []
    csvRows.push(headers.join(','))

    for (const log of logs) {
      const row = [
        log.id,
        log.db_name,
        log.usuario_responsable,
        new Date(log.fecha_exacta).toLocaleString('es-GT'),
        log.tabla_afectada,
        log.estado_anterior ? `"${log.estado_anterior.replace(/"/g, '""')}"` : '',
        log.estado_nuevo ? `"${log.estado_nuevo.replace(/"/g, '""')}"` : ''
      ]
      csvRows.push(row.join(','))
    }

    const csvData = csvRows.join('\n')
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'reporte_auditoria.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportPDF = () => {
    if (logs.length === 0) return

    const doc = new jsPDF('landscape')
    doc.text('Log Transaccional de Auditoría', 14, 15)
    doc.setFontSize(10)
    doc.text(`Fecha de generación: ${new Date().toLocaleString('es-GT')}`, 14, 22)

    const tableColumn = ['Base de Datos', 'Usuario', 'Fecha', 'Tabla', 'Estado Anterior', 'Estado Nuevo']
    const tableRows = logs.map(log => [
      log.db_name,
      log.usuario_responsable,
      new Date(log.fecha_exacta).toLocaleString('es-GT'),
      log.tabla_afectada,
      log.estado_anterior || '-',
      log.estado_nuevo || '-'
    ])

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    })

    doc.save('reporte_auditoria.pdf')
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Log Transaccional de Auditoría</h1>
          <p className="text-sm text-muted-foreground">{logs.length} registros encontrados</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            disabled={loading || logs.length === 0}
            className="flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
          <button
            onClick={handleExportPDF}
            disabled={loading || logs.length === 0}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Exportar PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-muted-foreground">Cargando registros...</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/90 backdrop-blur z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">BD</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Usuario</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tabla</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground max-w-xs">Anterior</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground max-w-xs">Nuevo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No hay registros de auditoría.
                    </td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} className="bg-card hover:bg-accent/40 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground font-medium">{log.db_name}</td>
                      <td className="px-4 py-3 text-foreground">{log.usuario_responsable}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(log.fecha_exacta).toLocaleString('es-GT')}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{log.tabla_afectada}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate" title={log.estado_anterior || ''}>
                        {log.estado_anterior || '-'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate" title={log.estado_nuevo || ''}>
                        {log.estado_nuevo || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
