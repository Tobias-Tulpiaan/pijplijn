'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { Pencil, X, Check } from 'lucide-react'
import Link from 'next/link'

interface Task {
  id: string
  title: string
  dueDate: Date | null
  completed: boolean
  candidateId: string
  assignedToId: string
  candidate: { id: string; name: string; company: { name: string } | null }
  assignedTo: { id: string; name: string }
}

type Variant = 'verlopen' | 'vandaag' | 'week' | 'volgend' | 'later' | 'geen'

interface Props {
  label: string
  variant: Variant
  tasks: Task[]
  users: { id: string; name: string }[]
}

const variantStyles: Record<Variant, {
  header: React.CSSProperties
  headerText: React.CSSProperties
  badge: React.CSSProperties
  row: React.CSSProperties
}> = {
  verlopen: {
    header: { backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderLeft: '4px solid #ef4444' },
    headerText: { color: '#991b1b' },
    badge: { backgroundColor: '#ef4444', color: '#fff' },
    row: { backgroundColor: '#fef2f2', border: '1px solid #fecaca' },
  },
  vandaag: {
    header: { backgroundColor: 'rgba(203,173,116,0.15)', borderLeft: '4px solid #CBAD74' },
    headerText: { color: '#A68A52' },
    badge: { backgroundColor: '#CBAD74', color: '#1A1A1A' },
    row: { backgroundColor: '#fff', border: '1px solid #e5e7eb' },
  },
  week: {
    header: { borderLeft: '4px solid #1A1A1A' },
    headerText: { color: '#1A1A1A' },
    badge: { backgroundColor: '#1A1A1A', color: '#fff' },
    row: { backgroundColor: '#fff', border: '1px solid #e5e7eb' },
  },
  volgend: {
    header: { borderLeft: '4px solid #6B6B6B' },
    headerText: { color: '#6B6B6B' },
    badge: { backgroundColor: '#6B6B6B', color: '#fff' },
    row: { backgroundColor: '#fff', border: '1px solid #e5e7eb' },
  },
  later: {
    header: { borderLeft: '4px solid #d1d5db' },
    headerText: { color: '#9ca3af' },
    badge: { backgroundColor: '#d1d5db', color: '#6B6B6B' },
    row: { backgroundColor: '#fff', border: '1px solid #e5e7eb' },
  },
  geen: {
    header: { borderLeft: '4px solid #d1d5db' },
    headerText: { color: '#9ca3af' },
    badge: { backgroundColor: '#d1d5db', color: '#6B6B6B' },
    row: { backgroundColor: '#fff', border: '1px solid #e5e7eb' },
  },
}

export function TakenGroep({ label, variant, tasks, users }: Props) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editAssignee, setEditAssignee] = useState('')
  const [saving, setSaving] = useState(false)
  const [topError, setTopError] = useState('')

  const s = variantStyles[variant]

  if (tasks.length === 0) return null

  function startEdit(task: Task) {
    setEditingId(task.id)
    setEditTitle(task.title)
    setEditDate(task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '')
    setEditAssignee(task.assignedToId)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function saveEdit(task: Task) {
    setSaving(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim() || task.title,
          dueDate: editDate || null,
          assignedToId: editAssignee || task.assignedToId,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Opslaan mislukt')
      }
      setEditingId(null)
      router.refresh()
    } catch (err) {
      setTopError(err instanceof Error ? err.message : 'Opslaan mislukt')
      setTimeout(() => setTopError(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Groep header */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg mb-2"
        style={s.header}
      >
        <span
          className="px-2.5 py-0.5 rounded-full text-xs font-bold"
          style={s.badge}
        >
          {label} ({tasks.length})
        </span>
      </div>

      {topError && (
        <div className="mb-2 px-3 py-2 rounded text-xs border" style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' }}>
          {topError}
        </div>
      )}

      <div className="space-y-1.5">
        {tasks.map((task) => {
          const isEditing = editingId === task.id

          if (isEditing) {
            return (
              <div
                key={task.id}
                className="rounded-lg p-3"
                style={{ backgroundColor: '#fafafa', border: '1px solid #CBAD74' }}
              >
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(task); if (e.key === 'Escape') cancelEdit() }}
                  className="w-full px-2 py-1 text-sm rounded border border-gray-200 outline-none focus:border-[#CBAD74] mb-2"
                  disabled={saving}
                  autoFocus
                />
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="flex-1 px-2 py-1 text-xs rounded border border-gray-200 outline-none focus:border-[#CBAD74]"
                    disabled={saving}
                  />
                  <select
                    value={editAssignee}
                    onChange={(e) => setEditAssignee(e.target.value)}
                    className="flex-1 px-2 py-1 text-xs rounded border border-gray-200 outline-none focus:border-[#CBAD74]"
                    disabled={saving}
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => saveEdit(task)}
                    disabled={saving}
                    className="p-1.5 rounded"
                    style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}
                  >
                    <Check size={13} />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-1.5 rounded hover:bg-gray-100"
                    style={{ color: '#6B6B6B' }}
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            )
          }

          return (
            <div
              key={task.id}
              className="group flex items-start justify-between gap-4 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
              style={s.row}
            >
              <Link
                href={`/kandidaat/${task.candidateId}#takensectie`}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{task.title}</p>
                <p className="text-xs mt-0.5" style={{ color: '#A68A52' }}>
                  {task.candidate.name}
                  {task.candidate.company && (
                    <span style={{ color: '#6B6B6B' }}> · {task.candidate.company.name}</span>
                  )}
                </p>
              </Link>

              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-right">
                  {task.dueDate && (
                    <p className="text-xs" style={{ color: '#6B6B6B' }}>
                      {format(new Date(task.dueDate), 'd MMM yyyy', { locale: nl })}
                    </p>
                  )}
                  <p className="text-xs" style={{ color: '#A68A52' }}>{task.assignedTo.name}</p>
                </div>
                <button
                  onClick={() => startEdit(task)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-gray-100 transition-opacity"
                  style={{ color: '#A68A52' }}
                  title="Bewerken"
                >
                  <Pencil size={13} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
