'use client'

import { useState } from 'react'
import { RefreshCw, Copy, Check } from 'lucide-react'
import { CollapsibleSection } from './CollapsibleSection'

interface ActiveContent {
  booleanNiche: string | null
  booleanMedium: string | null
  booleanBreed: string | null
  doorgroeiNiche: string | null
  doorgroeiBreed: string | null
}

interface Props {
  vacatureId: string
  content: ActiveContent | null
  skeleton?: boolean
  onRefreshField: (scope: string) => void
  refreshingField: string | null
}

type BooleanField = {
  key: keyof ActiveContent
  scope: string
  label: string
}

const FIELDS: BooleanField[] = [
  { key: 'booleanNiche',   scope: 'booleanNiche',   label: 'Niche' },
  { key: 'booleanMedium',  scope: 'booleanMedium',  label: 'Medium' },
  { key: 'booleanBreed',   scope: 'booleanBreed',   label: 'Breed' },
  { key: 'doorgroeiNiche', scope: 'doorgroeiNiche',  label: 'Doorgroei niche' },
  { key: 'doorgroeiBreed', scope: 'doorgroeiBreed',  label: 'Doorgroei breed' },
]

function BooleanItem({
  field,
  value,
  skeleton,
  onRefresh,
  refreshing,
}: {
  field: BooleanField
  value: string | null
  skeleton: boolean
  onRefresh: () => void
  refreshing: boolean
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B6B6B' }}>
          {field.label}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onRefresh}
            disabled={refreshing}
            title="Opnieuw genereren"
            className="p-1.5 rounded hover:bg-gray-50 transition-colors"
            style={{ color: refreshing ? '#d1d5db' : '#6B6B6B' }}
            onMouseEnter={(e) => { if (!refreshing) e.currentTarget.style.color = '#CBAD74' }}
            onMouseLeave={(e) => { if (!refreshing) e.currentTarget.style.color = '#6B6B6B' }}
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={copy}
            disabled={!value}
            title="Kopieer"
            className="flex items-center gap-1 px-2 py-1 rounded text-xs border transition-colors"
            style={{
              backgroundColor: '#F8F5EE',
              borderColor: copied ? '#CBAD74' : '#e5e0d2',
              color: '#1A1A1A',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#CBAD74')}
            onMouseLeave={(e) => { if (!copied) e.currentTarget.style.borderColor = '#e5e0d2' }}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? 'Gekopieerd' : 'Kopieer'}
          </button>
        </div>
      </div>
      {skeleton ? (
        <div className="h-10 rounded animate-pulse" style={{ backgroundColor: '#F3F0EA' }} />
      ) : value ? (
        <pre
          className="text-xs p-3 rounded border whitespace-pre-wrap break-words"
          style={{
            fontFamily: 'monospace',
            backgroundColor: '#F8F5EE',
            borderColor: '#E5E0D2',
            color: '#1A1A1A',
          }}
        >
          {value}
        </pre>
      ) : (
        <div className="text-xs p-3 rounded border" style={{ backgroundColor: '#F8F5EE', borderColor: '#E5E0D2', color: '#9ca3af' }}>
          Nog niet gegenereerd
        </div>
      )}
    </div>
  )
}

export function BooleansSection({ vacatureId, content, skeleton, onRefreshField, refreshingField }: Props) {
  return (
    <CollapsibleSection title="Booleans" icon="🔍" defaultOpen={true}>
      <div className="space-y-4">
        {FIELDS.map((field) => (
          <BooleanItem
            key={field.key}
            field={field}
            value={content?.[field.key] ?? null}
            skeleton={!!skeleton}
            onRefresh={() => onRefreshField(field.scope)}
            refreshing={refreshingField === field.scope}
          />
        ))}
      </div>
    </CollapsibleSection>
  )
}
