'use client'

import { useState } from 'react'
import { Plus, Pencil, Archive, MessageCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { extractVariables } from '@/lib/whatsapp'

const CATEGORY_LABELS: Record<string, string> = {
  algemeen: 'Algemeen',
  kandidaat: 'Kandidaat',
  contact: 'Contact',
}

interface Template {
  id: string
  name: string
  description: string | null
  body: string
  category: string | null
  active: boolean
  _count: { messages: number }
}

interface FormState {
  name: string
  description: string
  body: string
  category: string
}

const emptyForm: FormState = { name: '', description: '', body: '', category: 'algemeen' }

function TemplateDialog({
  open,
  onClose,
  onSaved,
  initial,
}: {
  open: boolean
  onClose: () => void
  onSaved: (t: Template) => void
  initial?: Template
}) {
  const [form, setForm] = useState<FormState>(
    initial
      ? { name: initial.name, description: initial.description ?? '', body: initial.body, category: initial.category ?? 'algemeen' }
      : emptyForm,
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const detectedVars = extractVariables(form.body)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.body.trim()) { setError('Naam en bericht zijn verplicht'); return }
    setError('')
    setLoading(true)
    try {
      const url = initial ? `/api/whatsapp-templates/${initial.id}` : '/api/whatsapp-templates'
      const method = initial ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, description: form.description || undefined }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Opslaan mislukt')
      }
      const saved = await res.json()
      onSaved(saved)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? 'Template bewerken' : 'Nieuwe template'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {error && (
            <div className="px-3 py-2 rounded text-xs border" style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' }}>
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Naam *</Label>
              <Input value={form.name} onChange={set('name')} placeholder="Naam van de template" className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Categorie</Label>
              <select
                value={form.category}
                onChange={set('category')}
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-xs"
              >
                <option value="algemeen">Algemeen</option>
                <option value="kandidaat">Kandidaat</option>
                <option value="contact">Contact</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Omschrijving (optioneel)</Label>
            <Input value={form.description} onChange={set('description')} placeholder="Korte beschrijving…" className="h-8 text-sm" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Bericht *</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <textarea
                  value={form.body}
                  onChange={set('body')}
                  rows={8}
                  placeholder="Typ je bericht…"
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-xs resize-none"
                />
                <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                  Gebruik {'{naam}'}, {'{datum}'}, {'{opdrachtgever}'}, {'{vacature}'}, {'{tijd}'}, {'{functie}'} als variabelen.
                </p>
                {detectedVars.length > 0 && (
                  <p className="text-xs mt-1" style={{ color: '#6B6B6B' }}>
                    Gevonden: {detectedVars.map((v) => `{${v}}`).join(', ')}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Voorbeeld preview:</p>
                <div
                  className="text-xs p-2 rounded border whitespace-pre-wrap min-h-[10rem]"
                  style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb', color: '#1A1A1A' }}
                >
                  {form.body
                    .replace(/\{naam\}/g, 'Jan')
                    .replace(/\{opdrachtgever\}/g, 'Bedrijf BV')
                    .replace(/\{functie\}/g, 'Software Engineer')
                    .replace(/\{datum\}/g, '5 mei')
                    .replace(/\{tijd\}/g, '10:00')
                    .replace(/\{vacature\}/g, 'Vacature X')
                    .replace(/\{aantal\}/g, '3') || <span style={{ color: '#9ca3af' }}>Typ een bericht…</span>
                  }
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" className="h-8 text-xs" onClick={onClose} disabled={loading}>
              Annuleren
            </Button>
            <Button
              type="submit"
              className="h-8 text-xs"
              disabled={loading}
              style={{ backgroundColor: loading ? '#e5e7eb' : '#CBAD74', color: '#1A1A1A' }}
            >
              {loading ? 'Opslaan…' : 'Opslaan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface Props {
  initialTemplates: Template[]
}

export function WhatsappTemplatesSection({ initialTemplates }: Props) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Template | null>(null)
  const [archiving, setArchiving] = useState<string | null>(null)

  const handleCreated = (t: Template) => setTemplates((prev) => [t, ...prev])
  const handleUpdated = (t: Template) => setTemplates((prev) => prev.map((x) => (x.id === t.id ? t : x)))

  const handleArchive = async (id: string) => {
    setArchiving(id)
    try {
      await fetch(`/api/whatsapp-templates/${id}`, { method: 'DELETE' })
      setTemplates((prev) => prev.filter((t) => t.id !== id))
    } finally {
      setArchiving(null)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm" style={{ color: '#6B6B6B' }}>
          Berichttemplates voor click-to-chat via WhatsApp. Variabelen worden automatisch ingevuld.
        </p>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
          style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}
        >
          <Plus size={14} />
          Nieuwe template
        </button>
      </div>

      {templates.length === 0 ? (
        <p className="text-sm" style={{ color: '#9ca3af' }}>Nog geen templates. Maak er een aan om te beginnen.</p>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <div
              key={t.id}
              className="flex items-start justify-between p-3 rounded-lg border"
              style={{ borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }}
            >
              <div className="min-w-0 flex-1 mr-3">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{t.name}</span>
                  {t.category && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#e5e7eb', color: '#6B6B6B' }}>
                      {CATEGORY_LABELS[t.category] ?? t.category}
                    </span>
                  )}
                  {t._count.messages > 0 && (
                    <span className="flex items-center gap-0.5 text-xs" style={{ color: '#9ca3af' }}>
                      <MessageCircle size={10} />
                      {t._count.messages}×
                    </span>
                  )}
                </div>
                <p className="text-xs line-clamp-2 whitespace-pre-line" style={{ color: '#6B6B6B' }}>
                  {t.body.slice(0, 120)}{t.body.length > 120 ? '…' : ''}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => setEditing(t)}
                  className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                  title="Bewerken"
                >
                  <Pencil size={13} style={{ color: '#6B6B6B' }} />
                </button>
                <button
                  onClick={() => handleArchive(t.id)}
                  disabled={archiving === t.id}
                  className="p-1.5 rounded hover:bg-red-100 transition-colors disabled:opacity-50"
                  title="Archiveren"
                >
                  <Archive size={13} style={{ color: '#dc2626' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <TemplateDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSaved={handleCreated}
      />

      {editing && (
        <TemplateDialog
          open={!!editing}
          onClose={() => setEditing(null)}
          onSaved={(t) => { handleUpdated(t); setEditing(null) }}
          initial={editing}
        />
      )}
    </>
  )
}
