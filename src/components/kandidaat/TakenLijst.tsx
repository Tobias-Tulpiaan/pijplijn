'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, isToday, isPast, formatDistanceToNow } from 'date-fns'
import { nl } from 'date-fns/locale'
import { Trash2, Plus, X, Download, Pencil, Check, Clock } from 'lucide-react'

interface Task {
  id: string
  title: string
  description?: string | null
  dueDate?: Date | string | null
  dueTime?: string | null
  completed: boolean
  assignedToId: string | null
  assignedTo: { id: string; name: string } | null
}

interface Props {
  candidateId: string
  tasks: Task[]
  users: { id: string; name: string }[]
  currentUserId: string
}

function taskRowStyle(task: Task) {
  if (task.completed || !task.dueDate) return { backgroundColor: '#ffffff', borderLeft: '4px solid transparent' }
  const d = new Date(task.dueDate)
  if (isToday(d)) return { backgroundColor: 'rgba(203,173,116,0.15)', borderLeft: '4px solid #CBAD74' }
  if (isPast(d)) return { backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444' }
  return { backgroundColor: '#ffffff', borderLeft: '4px solid transparent' }
}

function initialen(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

export function TakenLijst({ candidateId, tasks: initialTasks, users, currentUserId }: Props) {
  const router = useRouter()
  const [tasks, setTasks] = useState(initialTasks)
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [topError, setTopError] = useState('')

  // Inline edit state
  const [editingId, setEditingId]       = useState<string | null>(null)
  const [editTitle, setEditTitle]       = useState('')
  const [editDate, setEditDate]         = useState('')
  const [editTime, setEditTime]         = useState('')
  const [showEditTime, setShowEditTime] = useState(false)
  const [editAssignee, setEditAssignee] = useState('')
  const [editSaving, setEditSaving]     = useState(false)

  // New task form state
  const [newTitle, setNewTitle]       = useState('')
  const [newDate, setNewDate]         = useState('')
  const [showTime, setShowTime]       = useState(false)
  const [newTime, setNewTime]         = useState('')
  const [newAssignee, setNewAssignee] = useState(currentUserId)

  function startEdit(task: Task) {
    setEditingId(task.id)
    setEditTitle(task.title)
    setEditDate(task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '')
    setEditTime(task.dueTime ?? '')
    setShowEditTime(!!task.dueTime)
    setEditAssignee(task.assignedToId ?? '')
  }

  function cancelEdit() { setEditingId(null) }

  async function saveEdit(task: Task) {
    setEditSaving(true)
    const previousTasks = tasks
    const resolvedTime = showEditTime ? (editTime.trim() || null) : null
    setTasks((prev) => prev.map((t) =>
      t.id === task.id
        ? { ...t,
            title:       editTitle.trim() || t.title,
            dueDate:     editDate || null,
            dueTime:     resolvedTime,
            assignedToId: editAssignee,
            assignedTo:  users.find((u) => u.id === editAssignee) ?? t.assignedTo,
          }
        : t
    ))
    setEditingId(null)
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:       editTitle.trim() || task.title,
          dueDate:     editDate || null,
          dueTime:     resolvedTime,
          assignedToId: editAssignee || task.assignedToId,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Opslaan mislukt')
      }
      router.refresh()
    } catch (err) {
      setTasks(previousTasks)
      setTopError(err instanceof Error ? err.message : 'Opslaan mislukt')
      setTimeout(() => setTopError(''), 3000)
    } finally {
      setEditSaving(false)
    }
  }

  async function toggleCompleted(task: Task) {
    const updated = { ...task, completed: !task.completed }
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)))
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      })
      if (!res.ok) throw new Error()
      router.refresh()
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)))
    }
  }

  async function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      router.refresh()
    } catch {
      router.refresh()
    }
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:       newTitle.trim(),
          dueDate:     newDate || null,
          dueTime:     showTime ? (newTime.trim() || null) : null,
          candidateId,
          assignedToId: newAssignee,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Aanmaken mislukt')
      }
      const created = await res.json()
      setTasks((prev) => [created, ...prev])
      setNewTitle(''); setNewDate(''); setNewTime(''); setShowTime(false)
      setNewAssignee(currentUserId)
      setShowForm(false)
      router.refresh()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div id="takensectie" className="space-y-2">
      {topError && (
        <div className="px-3 py-2 rounded text-xs border" style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' }}>
          {topError}
        </div>
      )}

      {tasks.length === 0 && !showForm && (
        <p className="text-sm" style={{ color: '#6B6B6B' }}>Geen taken</p>
      )}

      {tasks.map((task) => {
        const isEditing = editingId === task.id

        if (isEditing) {
          return (
            <div key={task.id} className="rounded-md p-2.5"
              style={{ backgroundColor: '#fafafa', border: '1px solid #CBAD74' }}>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(task); if (e.key === 'Escape') cancelEdit() }}
                className="w-full px-2 py-1 text-sm rounded border border-gray-200 outline-none focus:border-[#CBAD74] mb-2"
                disabled={editSaving}
                autoFocus
              />
              <div className="flex gap-2 items-center flex-wrap mb-1.5">
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="flex-1 min-w-[120px] px-2 py-1 text-xs rounded border border-gray-200 outline-none focus:border-[#CBAD74]"
                  disabled={editSaving}
                />
                {showEditTime ? (
                  <div className="flex gap-1 items-center flex-1 min-w-[100px]">
                    <input
                      type="time"
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="flex-1 px-2 py-1 text-xs rounded border border-gray-200 outline-none focus:border-[#CBAD74]"
                      disabled={editSaving}
                    />
                    <button type="button" onClick={() => { setShowEditTime(false); setEditTime('') }}
                      className="text-gray-400 hover:text-gray-600 flex-shrink-0" title="Tijd verwijderen">
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowEditTime(true)}
                    className="flex items-center gap-1 text-xs hover:underline flex-shrink-0"
                    style={{ color: '#9ca3af' }}>
                    <Clock size={11} /> Tijd toevoegen
                  </button>
                )}
                <select
                  value={editAssignee}
                  onChange={(e) => setEditAssignee(e.target.value)}
                  className="flex-1 min-w-[100px] px-2 py-1 text-xs rounded border border-gray-200 outline-none focus:border-[#CBAD74]"
                  disabled={editSaving}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <button onClick={() => saveEdit(task)} disabled={editSaving}
                  className="p-1.5 rounded flex-shrink-0"
                  style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }} title="Opslaan">
                  <Check size={13} />
                </button>
                <button onClick={cancelEdit}
                  className="p-1.5 rounded hover:bg-gray-100 flex-shrink-0"
                  style={{ color: '#6B6B6B' }} title="Annuleren">
                  <X size={13} />
                </button>
              </div>
            </div>
          )
        }

        return (
          <div key={task.id}
            className="group flex items-start gap-3 rounded-md p-2.5"
            style={taskRowStyle(task)}>
            {/* Checkbox */}
            <button
              onClick={() => toggleCompleted(task)}
              className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0 border-2 transition-colors"
              style={{
                borderColor:     task.completed ? '#CBAD74' : '#d1d5db',
                backgroundColor: task.completed ? '#CBAD74' : 'transparent',
              }}
              aria-label={task.completed ? 'Markeer onvoltooid' : 'Markeer voltooid'}
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm"
                style={{
                  color:           task.completed ? '#6B6B6B' : '#1A1A1A',
                  textDecoration:  task.completed ? 'line-through' : undefined,
                }}>
                {task.title}
              </p>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                {task.dueDate && (
                  <span className="text-xs" style={{ color: '#6B6B6B' }}>
                    {format(new Date(task.dueDate), 'd MMM yyyy', { locale: nl })}
                    {' · '}
                    {task.dueTime
                      ? <span>{task.dueTime}</span>
                      : <span style={{ color: '#9ca3af' }}>hele dag</span>
                    }
                    {!task.completed && (
                      <span className="ml-1.5"
                        style={{ color: isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) ? '#ef4444' : '#A68A52' }}>
                        ({formatDistanceToNow(new Date(task.dueDate), { addSuffix: true, locale: nl })})
                      </span>
                    )}
                  </span>
                )}
                {task.assignedTo && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: '#A68A52' }}>
                    <span className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}>
                      {initialen(task.assignedTo.name)}
                    </span>
                    {task.assignedTo.name}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => startEdit(task)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity hover:bg-gray-100"
                style={{ color: '#A68A52' }} title="Bewerken">
                <Pencil size={13} />
              </button>
              {task.dueDate && (
                <a href={`/api/calendar/task/${task.id}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs transition-colors hover:bg-gray-100"
                  style={{ color: '#A68A52' }} title="Toevoegen aan Outlook">
                  <Download size={12} />Outlook
                </a>
              )}
              <button onClick={() => deleteTask(task.id)}
                className="p-1 rounded transition-colors hover:bg-red-50"
                style={{ color: '#9ca3af' }} aria-label="Verwijder taak">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        )
      })}

      {/* New task form */}
      {showForm ? (
        <form onSubmit={handleAddTask}
          className="rounded-md border border-gray-200 p-3 space-y-2 mt-2"
          style={{ backgroundColor: '#fafafa' }}>
          {formError && (
            <div className="px-3 py-2 rounded text-xs border"
              style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' }}>
              {formError}
            </div>
          )}
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Taakomschrijving..."
            required
            className="w-full px-3 py-1.5 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
          />
          <div className="flex gap-2 flex-wrap">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="flex-1 min-w-[130px] px-3 py-1.5 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
            />
            <select
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
              className="flex-1 min-w-[130px] px-3 py-1.5 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          {showTime ? (
            <div className="flex gap-2 items-center">
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
              />
              <button type="button" onClick={() => { setShowTime(false); setNewTime('') }}
                className="flex items-center gap-1 text-xs hover:underline flex-shrink-0"
                style={{ color: '#9ca3af' }}>
                <X size={13} /> Tijd verwijderen
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setShowTime(true)}
              className="flex items-center gap-1 text-xs hover:underline"
              style={{ color: '#9ca3af' }}>
              <Clock size={11} /> Tijd toevoegen
            </button>
          )}
          <div className="flex gap-2 justify-end">
            <button type="button"
              onClick={() => { setShowForm(false); setFormError(''); setShowTime(false); setNewTime('') }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-gray-200 hover:bg-gray-100"
              style={{ color: '#6B6B6B' }}>
              <X size={13} /> Annuleer
            </button>
            <button type="submit" disabled={formLoading}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md font-medium"
              style={{ backgroundColor: formLoading ? '#e5e7eb' : '#CBAD74', color: '#1A1A1A' }}>
              {formLoading ? 'Opslaan…' : 'Toevoegen'}
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-sm mt-1 hover:underline"
          style={{ color: '#A68A52' }}>
          <Plus size={14} /> Taak toevoegen
        </button>
      )}
    </div>
  )
}
