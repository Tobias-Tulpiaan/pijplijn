export const dynamic = 'force-dynamic'

import { CheckSquare } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { isToday, isPast, addDays, startOfDay } from 'date-fns'
import { TakenFilter } from '@/components/taken/TakenFilter'
import { TakenGroep } from '@/components/taken/TakenGroep'

type SearchParams = Promise<{ filter?: string }>

interface TaskWithRelations {
  id: string
  title: string
  dueDate: Date | null
  completed: boolean
  candidateId: string
  assignedToId: string
  candidate: { id: string; name: string; company: { name: string } | null }
  assignedTo: { id: string; name: string }
}

interface Groep {
  key: string
  label: string
  variant: 'verlopen' | 'vandaag' | 'week' | 'volgend' | 'later' | 'geen'
  tasks: TaskWithRelations[]
}

function groupTasks(tasks: TaskWithRelations[]): Groep[] {
  const today = startOfDay(new Date())
  const week1 = addDays(today, 7)
  const week2 = addDays(today, 14)

  const groups: Groep[] = [
    { key: 'verlopen',  label: 'Verlopen',      variant: 'verlopen', tasks: [] },
    { key: 'vandaag',   label: 'Vandaag',        variant: 'vandaag',  tasks: [] },
    { key: 'week',      label: 'Deze week',      variant: 'week',     tasks: [] },
    { key: 'volgend',   label: 'Volgende week',  variant: 'volgend',  tasks: [] },
    { key: 'later',     label: 'Later',          variant: 'later',    tasks: [] },
    { key: 'geen',      label: 'Geen deadline',  variant: 'geen',     tasks: [] },
  ]

  for (const task of tasks) {
    if (!task.dueDate) { groups[5].tasks.push(task); continue }
    const d = startOfDay(new Date(task.dueDate))
    if (isToday(d))       groups[1].tasks.push(task)
    else if (isPast(d))   groups[0].tasks.push(task)
    else if (d <= week1)  groups[2].tasks.push(task)
    else if (d <= week2)  groups[3].tasks.push(task)
    else                  groups[4].tasks.push(task)
  }

  return groups
}

export default async function TakenPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth()
  const params = await searchParams
  const filter = params.filter ?? 'mijn'

  const users = await prisma.user.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } })

  const where = {
    completed: false,
    ...(filter === 'mijn' && { assignedToId: session!.user.id }),
    ...(filter !== 'mijn' && filter !== 'alle' && { assignedTo: { name: filter } }),
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
    include: {
      candidate: { include: { company: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  })

  const groups = groupTasks(tasks)
  const hasAnyTask = groups.some((g) => g.tasks.length > 0)

  return (
    <div style={{ fontFamily: 'Aptos, Calibri, Arial, sans-serif' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Taken</h1>
        <TakenFilter users={users} currentFilter={filter} />
      </div>

      {!hasAnyTask ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-20"
          style={{ borderColor: '#CBAD74', backgroundColor: 'rgba(203,173,116,0.05)' }}
        >
          <CheckSquare size={40} style={{ color: '#CBAD74' }} className="mb-3" />
          <p className="text-lg font-semibold" style={{ color: '#A68A52' }}>Geen openstaande taken — top!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <TakenGroep
              key={group.key}
              label={group.label}
              variant={group.variant}
              tasks={group.tasks}
              users={users}
            />
          ))}
        </div>
      )}
    </div>
  )
}
