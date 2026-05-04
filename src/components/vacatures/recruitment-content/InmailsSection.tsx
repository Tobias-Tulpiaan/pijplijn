'use client'

import { useState } from 'react'
import { RefreshCw, Copy, Check } from 'lucide-react'
import { CollapsibleSection } from './CollapsibleSection'

interface ActiveContent {
  inmailOpenToWork: string | null
  inmailNietOpen: string | null
}

interface Props {
  vacatureId: string
  content: ActiveContent | null
  skeleton?: boolean
  onRefreshField: (scope: string) => void
  refreshingField: string | null
}

const MAX_CHARS = 1900

function InmailItem({
  label,
  scope,
  value,
  skeleton,
  onRefresh,
  refreshing,
}: {
  label: string
  scope: string
  value: string | null
  skeleton: boolean
  onRefresh: () => void
  refreshing: boolean
}) {
  const [copied, setCopied] = useState(false)
  const charCount = value?.length ?? 0
  const overLimit = charCount > MAX_CHARS

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
          {label}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <span
              className="text-xs"
              style={{ color: overLimit ? '#dc2626' : '#6B6B6B' }}
            >
              {charCount} / {MAX_CHARS}
            </span>
          )}
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
        <div className="h-24 rounded animate-pulse" style={{ backgroundColor: '#F3F0EA' }} />
      ) : value ? (
        <pre
          className="text-sm p-3 rounded border whitespace-pre-wrap break-words"
          style={{
            fontFamily: 'inherit',
            backgroundColor: '#F8F5EE',
            borderColor: overLimit ? '#fca5a5' : '#E5E0D2',
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

export function InmailsSection({ vacatureId, content, skeleton, onRefreshField, refreshingField }: Props) {
  return (
    <CollapsibleSection title="InMails" icon="✉️" defaultOpen={true}>
      <div className="space-y-5">
        <InmailItem
          label="Open to Work"
          scope="inmailOpenToWork"
          value={content?.inmailOpenToWork ?? null}
          skeleton={!!skeleton}
          onRefresh={() => onRefreshField('inmailOpenToWork')}
          refreshing={refreshingField === 'inmailOpenToWork'}
        />
        <InmailItem
          label="Niet open"
          scope="inmailNietOpen"
          value={content?.inmailNietOpen ?? null}
          skeleton={!!skeleton}
          onRefresh={() => onRefreshField('inmailNietOpen')}
          refreshing={refreshingField === 'inmailNietOpen'}
        />
      </div>
    </CollapsibleSection>
  )
}
