export const dynamic = 'force-dynamic'

import { CheckSquare } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { isToday, isTomorrow, isPast, addDays, startOfDay } from 'date-fns'
import { TakenFilter } from '@/components/taken/TakenFilter'
import { TakenTabs } from '@/components/taken/TakenTabs'
import { TakenGroep } from '@/components/taken/TakenGroep'
import { NieuweTaakDialog } from '@/components/taken/NieuweTaakDialog'

type SearchParams = Promise<{ filter?: string; q?: string; tab?: string }>

interface TaskWithRelations {
  id: string
  title: string
  dueDate: Date | null
  dueTime: string | null
  completed: boolean
  isShared: boolean
  candidateId: string | null
  companyId: string | null
  assignedToId: string | null
  candidate: { id: string; name: string; company: { name: string } | null } | null
  company: { id: string; name: string } | null
  assignedTo: { id: string; name: string } | null
}

type TabKey = 'alle' | 'verlopen' | 'vandaag' | 'morgen' | 'week' | 'later' | 'geen'

interface Groep {
  key:     TabKey
  variant: 'verlopen' | 'vandaag' | 'morgen' | 'week' | 'later' | 'geen'
  label:   string
  tasks:   TaskWithRelations[]
}

const GROUP_DEFS: { key: TabKey; variant: Groep['variant']; label: string }[] = [
  { key: 'verlopen', variant: 'verlopen', label: 'Verlopen' },
  { key: 'vandaag',  variant: 'vandaag',  label: 'Vandaag' },
  { key: 'morgen',   variant: 'morgen',   label: 'Morgen' },
  { key: 'week',     variant: 'week',     label: 'Komende 7 dagen' },
  { key: 'later',    variant: 'later',    label: 'Later' },
  { key: 'geen',     variant: 'geen',     label: 'Geen deadline' },
]

const GROUP_COLOR: Record<string, string> = {
  verlopen: '#991b1b',
  vandaag:  '#A68A52',
  morgen:   '#A68A52',
  week:     '#1A1A1A',
  later:    '#9ca3af',
  geen:     '#9ca3af',
}

function groupTasks(tasks: TaskWithRelations[]): Groep[] {
  const today = startOfDay(new Date())
  const plus7 = addDays(today, 7)

  const groups: Groep[] = GROUP_DEFS.map((d) => ({ ...d, tasks: [] }))

  for (const task of tasks) {
    if (!task.dueDate) { groups[5].tasks.push(task); continue }
    const d = startOfDay(new Date(task.dueDate))
    if (isToday(d))         groups[1].tasks.push(task)
    else if (isPast(d))     groups[0].tasks.push(task)
    else if (isTomorrow(d)) groups[2].tasks.push(task)
    else if (d <= plus7)    groups[3].tasks.push(task)
    else                    groups[4].tasks.push(task)
  }

  for (const g of groups) {
    g.tasks.sort((a, b) => {
      if (a.dueTime && b.dueTime) return a.dueTime.localeCompare(b.dueTime)
      if (a.dueTime) return -1
      if (b.dueTime) return 1
      return 0
    })
  }

  return groups
}

export default async function TakenPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth()
  const params  = await searchParams
  const filter  = params.filter ?? 'mijn'
  const q       = params.q ?? ''

  const [users, candidates, companies] = await Promise.all([
    prisma.user.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.candidate.findMany({
      where: { archived: false },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, company: { select: { name: true } } },
    }),
    prisma.company.findMany({
      where: { archived: false },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  const baseWhere = {
    completed: false,
    ...(filter === 'mijn' && {
      OR: [
        { assignedToId: session!.user.id },
        { isShared: true },
      ],
    }),
    ...(filter === 'gedeeld' && { isShared: true }),
    ...(filter !== 'mijn' && filter !== 'alle' && filter !== 'gedeeld' && {
      assignedTo: { name: filter },
    }),
  }

  const searchWhere = q ? {
    OR: [
      { title:     { contains: q, mode: 'insensitive' as const } },
      { candidate: { name:    { contains: q, mode: 'insensitive' as const } } },
      { candidate: { company: { name: { contains: q, mode: 'insensitive' as const } } } },
      { company:   { name:    { contains: q, mode: 'insensitive' as const } } },
    ],
  } : {}

  const where = { ...baseWhere, ...searchWhere }

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
    include: {
      candidate: { include: { company: true } },
      company:   { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  }) as TaskWithRelations[]

  const groups     = groupTasks(tasks)
  const hasAnyTask = groups.some((g) => g.tasks.length > 0)
  const total      = tasks.length

  const counts: Record<string, number> = {
    alle: total,
    ...Object.fromEntries(groups.map((g) => [g.key, g.tasks.length])),
  }

  const isSearchMode = !!q

  const validKeys: TabKey[] = ['alle', 'verlopen', 'vandaag', 'morgen', 'week', 'later', 'geen']
  const defaultTab: TabKey  = counts['verlopen'] > 0 ? 'verlopen' : 'vandaag'
  const tab: TabKey = params.tab && validKeys.includes(params.tab as TabKey)
    ? (params.tab as TabKey)
    : defaultTab

  const showAll = tab === 'alle' || isSearchMode

  const activeGroup = groups.find((g) => g.key === tab) ?? groups[1]

  return (
    <div style={{ fontFamily: 'Aptos, Calibri, Arial, sans-serif' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Taken</h1>
          <Link
            href="/taken/archief"
            className="text-xs hover:underline"
            style={{ color: '#9ca3af' }}
          >
            Bekijk archief →
          </Link>
        </div>
        <NieuweTaakDialog
          candidates={candidates}
          companies={companies}
          users={users}
          currentUserId={session!.user.id}
        />
      </div>

      <TakenFilter users={users} currentFilter={filter} currentQ={q} />

      {!hasAnyTask ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-20"
          style={{ borderColor: '#CBAD74', backgroundColor: 'rgba(203,173,116,0.05)' }}
        >
          <CheckSquare size={40} style={{ color: '#CBAD74' }} className="mb-3" />
          <p className="text-lg font-semibold" style={{ color: '#A68A52' }}>Geen openstaande taken — top!</p>
        </div>
      ) : (
        <>
          {isSearchMode ? (
            <div
              className="mb-5 px-4 py-2.5 rounded-lg text-sm"
              style={{ backgroundColor: 'rgba(203,173,116,0.1)', color: '#A68A52', border: '1px solid rgba(203,173,116,0.4)' }}
            >
              Zoekresultaten voor &ldquo;{q}&rdquo; — {total} {total === 1 ? 'taak' : 'taken'} gevonden
            </div>
          ) : (
            <TakenTabs counts={counts} activeTab={tab} />
          )}

          {showAll ? (
            <div className="space-y-8">
              {groups
                .filter((g) => g.tasks.length > 0)
                .map((g) => (
                  <div key={g.key}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold" style={{ color: GROUP_COLOR[g.key] }}>
                        {g.label}
                      </span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                        style={{ backgroundColor: GROUP_COLOR[g.key], color: '#fff' }}
                      >
                        {g.tasks.length}
                      </span>
                    </div>
                    <TakenGroep variant={g.variant} tasks={g.tasks} users={users} />
                  </div>
                ))
              }
            </div>
          ) : activeGroup.tasks.length === 0 ? (
            <div className="flex items-center justify-center py-16 rounded-xl border border-dashed border-gray-200">
              <p className="text-sm" style={{ color: '#9ca3af' }}>Geen taken in deze categorie</p>
            </div>
          ) : (
            <TakenGroep variant={activeGroup.variant} tasks={activeGroup.tasks} users={users} />
          )}
        </>
      )}
    </div>
  )
}
