'use client'

import { useState } from 'react'
import { CollapsibleSection } from './CollapsibleSection'

interface Props {
  vacatureId: string
  initialValue: string | null
  onSaved?: () => void
}

export function RecruiterInputSection({ vacatureId, initialValue, onSaved }: Props) {
  const [value, setValue] = useState(initialValue ?? '')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/vacatures/${vacatureId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recruiterInput: value.trim() || null }),
      })
      if (!res.ok) throw new Error('Opslaan mislukt')
      setDirty(false)
      onSaved?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fout bij opslaan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <CollapsibleSection title="Recruiter input" icon="📝" defaultOpen={false}>
      <div className="space-y-3">
        <p className="text-xs" style={{ color: '#6B6B6B' }}>
          Optioneel: cultuur, werksfeer, specifieke wensen van de opdrachtgever — wordt meegenomen in alle generaties.
        </p>
        <textarea
          value={value}
          onChange={(e) => { setValue(e.target.value); setDirty(true) }}
          rows={4}
          className="w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#CBAD74] resize-none"
          placeholder="Bijv. informele sfeer, veel autonomie, hecht team..."
        />
        {error && <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>}
        {dirty && (
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#A68A52')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#CBAD74')}
          >
            {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
        )}
      </div>
    </CollapsibleSection>
  )
}
