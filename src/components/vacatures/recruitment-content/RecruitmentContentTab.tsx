'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { RefreshCw, AlertCircle, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { BronSection } from './BronSection'
import { RecruiterInputSection } from './RecruiterInputSection'
import { BooleansSection } from './BooleansSection'
import { InmailsSection } from './InmailsSection'
import { VersieHistorieSection } from './VersieHistorieSection'

interface ActiveContent {
  id: string
  version: number
  isActive: boolean
  booleanNiche: string | null
  booleanMedium: string | null
  booleanBreed: string | null
  doorgroeiNiche: string | null
  doorgroeiBreed: string | null
  inmailOpenToWork: string | null
  inmailNietOpen: string | null
  createdAt: string
  createdByUser: { name: string } | null
  errorMessage: string | null
}

interface Version {
  id: string
  version: number
  isActive: boolean
  scope: string
  inputSource: string
  createdAt: string
  createdByUser: { name: string } | null
}

interface ContentData {
  contentStatus: 'NONE' | 'PENDING' | 'READY' | 'FAILED'
  werkenbijUrl: string | null
  vacatureTekst: string | null
  recruiterInput: string | null
  activeContent: ActiveContent | null
  versions: Version[]
}

interface Props {
  vacatureId: string
}

export function RecruitmentContentTab({ vacatureId }: Props) {
  const [data, setData] = useState<ContentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [refreshingField, setRefreshingField] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/vacatures/${vacatureId}/content`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
        return json as ContentData
      }
    } catch (e) {
      console.error('fetchData error', e)
    }
    return null
  }, [vacatureId])

  useEffect(() => {
    fetchData().finally(() => setLoading(false))
  }, [fetchData])

  // Poll bij PENDING status
  useEffect(() => {
    if (data?.contentStatus === 'PENDING') {
      pollRef.current = setTimeout(async () => {
        const fresh = await fetchData()
        if (fresh?.contentStatus === 'PENDING') {
          // blijf pollen (volgende render via state update)
        }
      }, 3000)
    }
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current)
    }
  }, [data, fetchData])

  async function triggerGenerate(scope: string) {
    if (scope === 'all') {
      setGenerating(true)
    } else {
      setRefreshingField(scope)
    }
    // Toon PENDING state direct
    setData((prev) => prev ? { ...prev, contentStatus: 'PENDING' } : prev)

    try {
      const res = await fetch(`/api/vacatures/${vacatureId}/generate-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope }),
      })
      if (!res.ok) throw new Error('Generatie mislukt')
      // POST is nu synchroon — na terugkomst herlaad de content
      await fetchData()
    } catch (e) {
      console.error(e)
      await fetchData()
    } finally {
      setGenerating(false)
      setRefreshingField(null)
    }
  }

  async function onRestored() {
    await fetchData()
  }

  const isPending = data?.contentStatus === 'PENDING'
  const isFailed = data?.contentStatus === 'FAILED'
  const hasContent = data?.contentStatus === 'READY'
  const lastUpdate = data?.activeContent?.createdAt
    ? format(new Date(data.activeContent.createdAt), 'd MMM HH:mm', { locale: nl })
    : null

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin" style={{ color: '#CBAD74' }} />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => triggerGenerate('all')}
            disabled={generating || isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={{
              backgroundColor: generating || isPending ? '#e5e7eb' : '#CBAD74',
              color: '#1A1A1A',
            }}
            onMouseEnter={(e) => { if (!generating && !isPending) e.currentTarget.style.backgroundColor = '#A68A52' }}
            onMouseLeave={(e) => { if (!generating && !isPending) e.currentTarget.style.backgroundColor = '#CBAD74' }}
          >
            <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
            Genereer alles opnieuw
          </button>
          {lastUpdate && (
            <span className="text-xs" style={{ color: '#6B6B6B' }}>
              Laatste update: {lastUpdate}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isPending && (
            <span className="flex items-center gap-1.5 text-sm" style={{ color: '#d97706' }}>
              <Loader2 size={14} className="animate-spin" /> Bezig met genereren…
            </span>
          )}
          {hasContent && (
            <span className="text-sm font-medium" style={{ color: '#16a34a' }}>Klaar</span>
          )}
          {isFailed && (
            <span className="flex items-center gap-1 text-sm" style={{ color: '#dc2626' }}>
              <AlertCircle size={14} /> Mislukt
            </span>
          )}
        </div>
      </div>

      {/* PENDING banner */}
      {isPending && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-lg border text-sm"
          style={{ backgroundColor: 'rgba(217,119,6,0.05)', borderColor: '#d97706', color: '#92400e' }}
        >
          <Loader2 size={15} className="animate-spin shrink-0" />
          Content wordt gegenereerd… dit duurt 30–60 seconden
        </div>
      )}

      {/* FAILED banner */}
      {isFailed && data?.activeContent?.errorMessage && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-lg border text-sm"
          style={{ backgroundColor: 'rgba(220,38,38,0.05)', borderColor: '#fca5a5', color: '#991b1b' }}
        >
          <AlertCircle size={15} className="shrink-0" />
          <span>
            <strong>Generatie mislukt:</strong> {data.activeContent.errorMessage}
          </span>
        </div>
      )}

      {/* Bron sectie */}
      <BronSection
        vacatureId={vacatureId}
        initialUrl={data?.werkenbijUrl ?? null}
        initialTekst={data?.vacatureTekst ?? null}
      />

      {/* Recruiter input */}
      <RecruiterInputSection
        vacatureId={vacatureId}
        initialValue={data?.recruiterInput ?? null}
      />

      {/* Booleans */}
      <BooleansSection
        vacatureId={vacatureId}
        content={data?.activeContent ?? null}
        skeleton={isPending}
        onRefreshField={triggerGenerate}
        refreshingField={refreshingField}
      />

      {/* InMails */}
      <InmailsSection
        vacatureId={vacatureId}
        content={data?.activeContent ?? null}
        skeleton={isPending}
        onRefreshField={triggerGenerate}
        refreshingField={refreshingField}
      />

      {/* Versie-historie */}
      {(data?.versions?.length ?? 0) > 0 && (
        <VersieHistorieSection
          vacatureId={vacatureId}
          versions={data!.versions}
          onRestored={onRestored}
        />
      )}
    </div>
  )
}
