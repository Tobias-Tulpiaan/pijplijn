'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Clock, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

interface Task {
  id: string
  title: string
  description?: string | null
  dueDate: Date | null
  dueTime: string | null
  isShared: boolean
  assignedToId: string | null
  assignedTo: { id: string; name: string } | null
}

interface Props {
  task:    Task | null
  onClose: () => void
  users:   { id: string; name: string }[]
}

export function BewerkTaakDialog({ task, onClose, users }: Props) {
  const router = useRouter()

  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [dueDate,     setDueDate]     = useState('')
  const [showTime,    setShowTime]    = useState(false)
  const [dueTime,     setDueTime]     = useState('')
  const [isShared,    setIsShared]    = useState(false)
  const [assignedTo,  setAssignedTo]  = useState('')
  const [saving,      setSaving]      = useState(false)
  const [deleting,    setDeleting]    = useState(false)
  const [confirmDel,  setConfirmDel]  = useState(false)
  const [error,       setError]       = useState('')

  useEffect(() => {
    if (!task) return
    setTitle(task.title)
    setDescription(task.description ?? '')
    setDueDate(task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '')
    setDueTime(task.dueTime ?? '')
    setShowTime(!!task.dueTime)
    setIsShared(task.isShared)
    setAssignedTo(task.assignedToId ?? '')
    setError('')
    setConfirmDel(false)
  }, [task])

  if (!task) return null

  async function handleSave() {
    if (!title.trim()) { setError('Titel is verplicht'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/tasks/${task!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          dueDate: dueDate || null,
          dueTime: showTime ? (dueTime.trim() || null) : null,
          isShared,
          assignedToId: isShared ? null : (assignedTo || null),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Opslaan mislukt')
      }
      onClose()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opslaan mislukt')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirmDel) { setConfirmDel(true); return }
    setDeleting(true)
    try {
      const res = await fetch(`/api/tasks/${task!.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Verwijderen mislukt')
      onClose()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verwijderen mislukt')
      setDeleting(false)
      setConfirmDel(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-xl shadow-xl p-6"
        style={{ backgroundColor: '#fff', fontFamily: 'Aptos, Calibri, Arial, sans-serif' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold" style={{ color: '#1A1A1A' }}>Taak bewerken</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100" style={{ color: '#6B6B6B' }}>
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="mb-3 px-3 py-2 rounded text-xs border" style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' }}>
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Titel *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
              disabled={saving}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Omschrijving</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74] resize-none"
              rows={2}
              disabled={saving}
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Vervaldatum</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
                disabled={saving}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Tijd</label>
              {showTime ? (
                <div className="flex gap-1 items-center">
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
                    disabled={saving}
                  />
                  <button type="button" onClick={() => { setShowTime(false); setDueTime('') }}
                    className="p-2 rounded hover:bg-gray-100" style={{ color: '#9ca3af' }}>
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setShowTime(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-md border border-dashed border-gray-200 hover:border-[#CBAD74] w-full"
                  style={{ color: '#9ca3af' }}>
                  <Clock size={13} />
                  Tijd toevoegen
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
                disabled={saving}
                className="rounded"
              />
              <span className="text-sm" style={{ color: '#1A1A1A' }}>👥 Gedeelde taak (voor heel team)</span>
            </label>
          </div>

          {!isShared && (
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Toegewezen aan</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
                disabled={saving}
              >
                <option value="">— Niet toegewezen —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={handleSave}
            disabled={saving || deleting}
            className="flex-1 py-2 text-sm font-medium rounded-md transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}
          >
            {saving ? 'Opslaan...' : 'Opslaan'}
          </button>
          <button
            onClick={onClose}
            disabled={saving || deleting}
            className="px-4 py-2 text-sm rounded-md border border-gray-200 hover:bg-gray-50"
            style={{ color: '#6B6B6B' }}
          >
            Annuleren
          </button>
          <button
            onClick={handleDelete}
            disabled={saving || deleting}
            className="px-3 py-2 text-sm rounded-md transition-colors"
            style={{
              backgroundColor: confirmDel ? '#ef4444' : '#fef2f2',
              color: confirmDel ? '#fff' : '#dc2626',
              border: '1px solid #fecaca',
            }}
            title={confirmDel ? 'Nogmaals klikken om te bevestigen' : 'Taak verwijderen'}
          >
            <Trash2 size={14} />
          </button>
        </div>
        {confirmDel && (
          <p className="mt-2 text-xs text-center" style={{ color: '#9ca3af' }}>
            Klik nogmaals op het prullenbakje om te bevestigen
          </p>
        )}
      </div>
    </div>
  )
}
