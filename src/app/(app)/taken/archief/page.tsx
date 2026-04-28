export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ArrowLeft, Archive } from 'lucide-react'
import { format, subDays } from 'date-fns'
import { nl } from 'date-fns/locale'
import { prisma } from '@/lib/prisma'
import { ArchiefFilters } from '@/components/taken/ArchiefFilters'
import { HeractiveerTaakKnop } from '@/components/taken/HeractiveerTaakKnop'

type SearchParams = Promise<{
  van?:          string
  tot?:          string
  assignedToId?: string
  type?:         string
  q?:            string
  page?:         string
}>

const TYPE_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  kandidaat:    { label: 'Kandidaat',     bg: '#dbeafe', color: '#1d4ed8' },
  opdrachtgever:{ label: 'Opdrachtgever', bg: '#fef9c3', color: '#854d0e' },
  gedeeld:      { label: 'Gedeeld',       bg: 'rgba(203,173,116,0.2)', color: '#A68A52' },
  persoonlijk:  { label: 'Persoonlijk',   bg: '#f3f4f6', color: '#6B6B6B' },
}

function getTaskType(task: { candidateId: string | null; companyId: string | null; isShared: boolean }) {
  if (task.candidateId)  return 'kandidaat'
  if (task.companyId)    return 'opdrachtgever'
  if (task.isShared)     return 'gedeeld'
  return 'persoonlijk'
}

export default async function TakenArchiefPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams

  const today     = new Date()
  const vanStr    = params.van          ?? format(subDays(today, 30), 'yyyy-MM-dd')
  const totStr    = params.tot          ?? format(today,              'yyyy-MM-dd')
  const assigneeId = params.assignedToId ?? ''
  const typeFilter = params.type         ?? ''
  const q          = params.q            ?? ''
  const page       = parseInt(params.page ?? '0', 10)

  const vanDate = new Date(vanStr)
  const totDate = new Date(totStr)
  totDate.setHours(23, 59, 59, 999)

  const typeWhere: Record<string, unknown> =
    typeFilter === 'kandidaat'     ? { candidateId: { not: null } } :
    typeFilter === 'opdrachtgever' ? { companyId:   { not: null } } :
    typeFilter === 'gedeeld'       ? { isShared: true, candidateId: null, companyId: null } :
    typeFilter === 'persoonlijk'   ? { isShared: false, candidateId: null, companyId: null } :
    {}

  const where = {
    completed: true,
    completedAt: { gte: vanDate, lte: totDate },
    ...(assigneeId ? { assignedToId: assigneeId } : {}),
    ...(q ? { title: { contains: q, mode: 'insensitive' as const } } : {}),
    ...typeWhere,
  }

  const [tasks, total, users] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        candidate:   { include: { company: true } },
        company:     { select: { id: true, name: true } },
        assignedTo:  { select: { id: true, name: true } },
        completedBy: { select: { id: true, name: true } },
      },
      orderBy: { completedAt: 'desc' },
      skip:  page * 50,
      take:  50,
    }),
    prisma.task.count({ where }),
    prisma.user.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ])

  const totalPages = Math.ceil(total / 50)

  return (
    <div style={{ fontFamily: 'Aptos, Calibri, Arial, sans-serif' }}>
      <Link
        href="/taken"
        className="flex items-center gap-1.5 text-sm mb-6 hover:underline"
        style={{ color: '#6B6B6B' }}
      >
        <ArrowLeft size={15} />
        Taken
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <Archive size={20} style={{ color: '#CBAD74' }} />
        <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Taken archief</h1>
        <span className="text-sm" style={{ color: '#9ca3af' }}>{total} resultaten</span>
      </div>

      <ArchiefFilters
        users={users}
        currentFrom={vanStr}
        currentTo={totStr}
        currentAssignee={assigneeId}
        currentType={typeFilter}
        currentQ={q}
      />

      {tasks.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-16"
          style={{ borderColor: '#e5e7eb', backgroundColor: '#fafafa' }}
        >
          <Archive size={32} style={{ color: '#d1d5db' }} className="mb-2" />
          <p className="text-sm" style={{ color: '#9ca3af' }}>Geen afgevinkte taken in deze periode</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B6B6B' }}>Taak</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B6B6B' }}>Koppeling</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B6B6B' }}>Afgevinkt op</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B6B6B' }}>Door</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, i) => {
                  const type   = getTaskType(task)
                  const badge  = TYPE_BADGE[type]
                  const isLast = i === tasks.length - 1

                  return (
                    <tr
                      key={task.id}
                      style={{ borderBottom: isLast ? 'none' : '1px solid #f3f4f6' }}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium" style={{ color: '#1A1A1A' }}>{task.title}</p>
                        {task.description && (
                          <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{task.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span
                            className="inline-block px-2 py-0.5 rounded-full text-xs font-medium w-fit"
                            style={{ backgroundColor: badge.bg, color: badge.color }}
                          >
                            {badge.label}
                          </span>
                          {task.candidate && (
                            <Link
                              href={`/kandidaat/${task.candidate.id}`}
                              className="text-xs hover:underline"
                              style={{ color: '#A68A52' }}
                            >
                              {task.candidate.name}
                              {task.candidate.company && (
                                <span style={{ color: '#6B6B6B' }}> · {task.candidate.company.name}</span>
                              )}
                            </Link>
                          )}
                          {task.company && (
                            <Link
                              href={`/opdrachtgevers/${task.company.id}`}
                              className="text-xs hover:underline"
                              style={{ color: '#A68A52' }}
                            >
                              {task.company.name}
                            </Link>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6B6B6B' }}>
                        {task.completedAt
                          ? format(new Date(task.completedAt), 'd MMM yyyy, HH:mm', { locale: nl })
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6B6B6B' }}>
                        {task.completedBy?.name ?? task.assignedTo?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <HeractiveerTaakKnop taskId={task.id} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs" style={{ color: '#9ca3af' }}>
                Pagina {page + 1} van {totalPages} · {total} resultaten
              </span>
              <div className="flex gap-2">
                {page > 0 && (
                  <Link
                    href={`/taken/archief?van=${vanStr}&tot=${totStr}&page=${page - 1}${assigneeId ? `&assignedToId=${assigneeId}` : ''}${typeFilter ? `&type=${typeFilter}` : ''}${q ? `&q=${q}` : ''}`}
                    className="px-3 py-1.5 text-xs rounded-md border border-gray-200 hover:bg-gray-50"
                    style={{ color: '#6B6B6B' }}
                  >
                    ← Vorige
                  </Link>
                )}
                {page + 1 < totalPages && (
                  <Link
                    href={`/taken/archief?van=${vanStr}&tot=${totStr}&page=${page + 1}${assigneeId ? `&assignedToId=${assigneeId}` : ''}${typeFilter ? `&type=${typeFilter}` : ''}${q ? `&q=${q}` : ''}`}
                    className="px-3 py-1.5 text-xs rounded-md border border-gray-200 hover:bg-gray-50"
                    style={{ color: '#6B6B6B' }}
                  >
                    Volgende →
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
