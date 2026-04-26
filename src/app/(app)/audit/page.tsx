export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { Shield } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

type SearchParams = Promise<{ page?: string }>

const PAGE_SIZE = 50

export default async function AuditPage({ searchParams }: { searchParams: SearchParams }) {
  await auth()
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1') || 1)

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip:  (page - 1) * PAGE_SIZE,
      take:  PAGE_SIZE,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count(),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div style={{ fontFamily: 'Aptos, Calibri, Arial, sans-serif' }}>
      <Link
        href="/instellingen"
        className="inline-flex items-center gap-1 text-xs hover:underline mb-4"
        style={{ color: '#6B6B6B' }}
      >
        ← Terug naar instellingen
      </Link>
      <div className="flex items-center gap-2 mb-6">
        <Shield size={22} style={{ color: '#6B6B6B' }} />
        <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Audit log</h1>
        <span className="text-sm ml-2" style={{ color: '#6B6B6B' }}>
          {total} entries
        </span>
      </div>

      <div className="rounded-lg overflow-hidden shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}>
                {['Tijd', 'Gebruiker', 'Actie', 'Type', 'ID', 'IP'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr
                  key={log.id}
                  style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#F8F5EE' }}
                >
                  <td className="px-4 py-2 text-xs whitespace-nowrap" style={{ color: '#6B6B6B' }}>
                    {format(new Date(log.createdAt), 'd MMM yyyy HH:mm:ss', { locale: nl })}
                  </td>
                  <td className="px-4 py-2 text-xs" style={{ color: '#1A1A1A' }}>
                    {log.user?.name ?? <span style={{ color: '#9ca3af' }}>—</span>}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor: log.action.includes('failed') || log.action.includes('delete')
                          ? 'rgba(220,38,38,0.1)' : 'rgba(203,173,116,0.15)',
                        color: log.action.includes('failed') || log.action.includes('delete')
                          ? '#dc2626' : '#A68A52',
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs" style={{ color: '#6B6B6B' }}>
                    {log.entityType ?? '—'}
                  </td>
                  <td className="px-4 py-2 text-xs font-mono" style={{ color: '#9ca3af' }}>
                    {log.entityId ? log.entityId.slice(0, 8) + '…' : '—'}
                  </td>
                  <td className="px-4 py-2 text-xs font-mono" style={{ color: '#9ca3af' }}>
                    {log.ipAddress ?? '—'}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: '#6B6B6B' }}>
                    Geen log-entries gevonden
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginering */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span style={{ color: '#6B6B6B' }}>
            Pagina {page} van {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`?page=${page - 1}`}
                className="px-3 py-1.5 rounded border text-sm"
                style={{ borderColor: '#CBAD74', color: '#A68A52' }}
              >
                Vorige
              </a>
            )}
            {page < totalPages && (
              <a
                href={`?page=${page + 1}`}
                className="px-3 py-1.5 rounded border text-sm"
                style={{ borderColor: '#CBAD74', color: '#A68A52' }}
              >
                Volgende
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
