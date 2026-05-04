'use client'

import { useState } from 'react'
import { CollapsibleSection } from './CollapsibleSection'

interface Props {
  vacatureId: string
  initialUrl: string | null
  initialTekst: string | null
  onSaved?: () => void
}

export function BronSection({ vacatureId, initialUrl, initialTekst, onSaved }: Props) {
  const hasText = !!(initialTekst?.trim())
  const [mode, setMode] = useState<'url' | 'text'>(hasText ? 'text' : 'url')
  const [url, setUrl] = useState(initialUrl ?? '')
  const [tekst, setTekst] = useState(initialTekst ?? '')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')

  const inputCls = 'w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#CBAD74] resize-none'

  async function save() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/vacatures/${vacatureId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          werkenbijUrl: mode === 'url' ? url.trim() || null : null,
          vacatureTekst: mode === 'text' ? tekst.trim() || null : null,
        }),
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
    <CollapsibleSection title="Bron" icon="📥" defaultOpen={false}>
      <div className="space-y-3">
        <div className="flex gap-4 text-sm">
          {(['url', 'text'] as const).map((m) => (
            <label key={m} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="bron-mode"
                value={m}
                checked={mode === m}
                onChange={() => { setMode(m); setDirty(true) }}
              />
              <span style={{ color: '#1A1A1A' }}>{m === 'url' ? 'Werkenbij URL' : 'Vacaturetekst'}</span>
            </label>
          ))}
        </div>

        {mode === 'url' ? (
          <input
            type="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setDirty(true) }}
            className={inputCls}
            placeholder="https://werkenbij.bedrijf.nl/vacature/..."
          />
        ) : (
          <textarea
            value={tekst}
            onChange={(e) => { setTekst(e.target.value); setDirty(true) }}
            rows={6}
            className={inputCls}
            placeholder="Plak hier de vacaturetekst..."
          />
        )}

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
