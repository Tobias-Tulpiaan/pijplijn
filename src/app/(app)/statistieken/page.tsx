export const dynamic = 'force-dynamic'

import {
  startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear,
  format, differenceInDays,
} from 'date-fns'
import { nl } from 'date-fns/locale'
import { BarChart3, Users, UserCheck, TrendingUp, Clock } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { STAGES } from '@/types'
import { StatFilter } from '@/components/statistieken/StatFilter'

type SearchParams = Promise<{ period?: string; consultant?: string }>

function getPeriodRange(period: string): { start: Date; end: Date } | null {
  const now = new Date()
  switch (period) {
    case 'this_month':    return { start: startOfMonth(now), end: endOfMonth(now) }
    case 'last_month':    { const m = subMonths(now, 1); return { start: startOfMonth(m), end: endOfMonth(m) } }
    case 'last_3_months': return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) }
    case 'this_year':     return { start: startOfYear(now), end: endOfYear(now) }
    default:              return null
  }
}

function periodLabel(period: string): string {
  switch (period) {
    case 'this_month':    return 'deze maand'
    case 'last_month':    return 'vorige maand'
    case 'last_3_months': return 'laatste 3 maanden'
    case 'this_year':     return 'dit jaar'
    default:              return 'alle tijd'
  }
}

export default async function StatistiekenPage({ searchParams }: { searchParams: SearchParams }) {
  const params   = await searchParams
  const period   = params.period   ?? 'this_month'
  const ownerId  = params.consultant ?? ''

  const range    = getPeriodRange(period)
  const now      = new Date()

  const ownerFilter  = ownerId ? { ownerId } : {}
  const rangeFilter  = range   ? { gte: range.start, lte: range.end } : undefined

  const [
    activeCount,
    archivedInPeriod,
    stageHistoryInPeriod,
    candidatesInPeriod,
    users,
    activeByOwner,
    archived6Months,
  ] = await Promise.all([
    prisma.candidate.count({ where: { archived: false, ...ownerFilter } }),

    prisma.candidate.findMany({
      where: {
        archived: true,
        ...(rangeFilter && { archivedAt: rangeFilter }),
        ...ownerFilter,
      },
      select: { archivedReason: true, archivedAt: true, createdAt: true, ownerId: true },
    }),

    prisma.stageHistory.findMany({
      where: {
        ...(rangeFilter && { changedAt: rangeFilter }),
        ...(ownerId && { candidate: { ownerId } }),
      },
      select: { toStage: true, candidateId: true },
    }),

    prisma.candidate.count({
      where: {
        ...(rangeFilter && { createdAt: rangeFilter }),
        ...ownerFilter,
      },
    }),

    prisma.user.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),

    prisma.candidate.groupBy({
      by: ['ownerId'],
      where: { archived: false },
      _count: { id: true },
    }),

    prisma.candidate.findMany({
      where: {
        archived: true,
        archivedAt: { gte: startOfMonth(subMonths(now, 5)) },
        ...ownerFilter,
      },
      select: { archivedReason: true, archivedAt: true },
    }),
  ])

  // ── Kengetallen ──────────────────────────────────────────────────────────
  const aangenomen      = archivedInPeriod.filter(c => c.archivedReason === 'aangenomen').length
  const totalAfgesloten = archivedInPeriod.length
  const conversiePercent = totalAfgesloten > 0 ? Math.round(aangenomen / totalAfgesloten * 100) : 0

  const aangenomenCandidates = archivedInPeriod.filter(c => c.archivedReason === 'aangenomen' && c.archivedAt)
  const avgDagen = aangenomenCandidates.length > 0
    ? Math.round(aangenomenCandidates.reduce((s, c) => s + differenceInDays(c.archivedAt!, c.createdAt), 0) / aangenomenCandidates.length)
    : null

  // ── Funnel ───────────────────────────────────────────────────────────────
  const funnelData = STAGES.map(stage => {
    const count = stage.pct === 10
      ? candidatesInPeriod
      : new Set(stageHistoryInPeriod.filter(h => h.toStage === stage.pct).map(h => h.candidateId)).size
    return { pct: stage.pct, label: stage.label, count }
  })
  const maxFunnel = funnelData[0]?.count || 1

  // ── Maand-data (altijd 6 maanden) ─────────────────────────────────────
  const maandData = Array.from({ length: 6 }, (_, i) => {
    const d     = subMonths(now, 5 - i)
    const key   = format(d, 'yyyy-MM')
    const label = format(d, 'MMM', { locale: nl })
    const full  = format(d, 'MMMM yyyy', { locale: nl })
    const items = archived6Months.filter(c => c.archivedAt && format(c.archivedAt, 'yyyy-MM') === key)
    return {
      key, label, full,
      aangenomen:    items.filter(c => c.archivedReason === 'aangenomen').length,
      afgewezen:     items.filter(c => c.archivedReason === 'afgewezen').length,
      afgehaakt:     items.filter(c => c.archivedReason === 'afgehaakt').length,
      niet_relevant: items.filter(c => c.archivedReason === 'niet_relevant').length,
    }
  })
  const maxMaand = Math.max(...maandData.map(m => m.aangenomen + m.afgewezen + m.afgehaakt + m.niet_relevant), 1)

  // ── Per consultant ────────────────────────────────────────────────────
  const consultantData = users.map(u => {
    const inPijplijn   = activeByOwner.find(g => g.ownerId === u.id)?._count.id ?? 0
    const userArchived = archivedInPeriod.filter(c => c.ownerId === u.id)
    const ua = userArchived.filter(c => c.archivedReason === 'aangenomen').length
    const uw = userArchived.filter(c => c.archivedReason === 'afgewezen').length
    const totaal = userArchived.length
    return { id: u.id, name: u.name, inPijplijn, aangenomen: ua, afgewezen: uw, afgesloten: totaal, conversiePercent: totaal > 0 ? Math.round(ua / totaal * 100) : 0 }
  }).sort((a, b) => b.aangenomen - a.aangenomen)

  // Funnel gold gradient: lightest at 10%, darkest at 100%
  function funnelColor(i: number): string {
    const opacity = 0.35 + (i / (STAGES.length - 1)) * 0.65
    return `rgba(203,173,116,${opacity.toFixed(2)})`
  }

  return (
    <div className="space-y-6" style={{ fontFamily: 'Aptos, Calibri, Arial, sans-serif' }}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={22} style={{ color: '#6B6B6B' }} />
          <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Statistieken</h1>
          <span className="text-sm ml-1" style={{ color: '#6B6B6B' }}>— {periodLabel(period)}</span>
        </div>
        <StatFilter users={users} currentPeriod={period} currentOwnerId={ownerId} />
      </div>

      {/* ── Sectie 1: Kengetallen ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Actieve kandidaten',
            value: activeCount,
            sub: 'in pijplijn',
            icon: <Users size={20} style={{ color: '#CBAD74' }} />,
          },
          {
            label: 'Aangenomen',
            value: aangenomen,
            sub: periodLabel(period),
            icon: <UserCheck size={20} style={{ color: '#16a34a' }} />,
            color: '#16a34a',
          },
          {
            label: 'Conversie',
            value: `${conversiePercent}%`,
            sub: totalAfgesloten > 0 ? `van ${totalAfgesloten} afgesloten` : 'geen afgesloten',
            icon: <TrendingUp size={20} style={{ color: '#CBAD74' }} />,
          },
          {
            label: 'Gem. doorlooptijd',
            value: avgDagen !== null ? `${avgDagen}d` : '—',
            sub: 'aangenomen kandidaten',
            icon: <Clock size={20} style={{ color: '#6B6B6B' }} />,
          },
        ].map((card, i) => (
          <div
            key={i}
            className="rounded-lg p-5 shadow-sm border border-gray-100 bg-white"
          >
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B6B6B' }}>{card.label}</p>
              {card.icon}
            </div>
            <p className="text-3xl font-bold" style={{ color: card.color ?? '#A68A52' }}>{card.value}</p>
            <p className="text-xs mt-1" style={{ color: '#6B6B6B' }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Sectie 2: Pijplijn-funnel ── */}
      <div className="rounded-lg bg-white shadow-sm border border-gray-100 p-5">
        <h2 className="text-base font-semibold mb-4" style={{ color: '#1A1A1A' }}>Pijplijn-funnel</h2>
        {candidatesInPeriod === 0 && stageHistoryInPeriod.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: '#9ca3af' }}>
            Geen data voor de geselecteerde periode
          </p>
        ) : (
          <div className="space-y-1.5">
            {funnelData.map((row, i) => {
              const barWidth = maxFunnel > 0 ? Math.round(row.count / maxFunnel * 100) : 0
              return (
                <div key={row.pct} className="flex items-center gap-3">
                  <div className="w-36 flex-shrink-0 text-right">
                    <span className="text-xs font-bold" style={{ color: '#A68A52' }}>{row.pct}%</span>
                    <span className="block text-[10px] leading-tight truncate" style={{ color: '#6B6B6B' }}>{row.label}</span>
                  </div>
                  <div className="flex-1 relative h-7 rounded overflow-hidden" style={{ backgroundColor: '#f3f4f6' }}>
                    <div
                      className="absolute inset-y-0 left-0 rounded transition-all"
                      style={{ width: `${barWidth}%`, backgroundColor: funnelColor(i) }}
                    />
                    {row.count > 0 && (
                      <span className="absolute inset-y-0 left-2 flex items-center text-xs font-medium" style={{ color: '#1A1A1A' }}>
                        {row.count}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Sectie 3: Resultaten per maand ── */}
      <div className="rounded-lg bg-white shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold" style={{ color: '#1A1A1A' }}>Resultaten per maand</h2>
          <div className="flex items-center gap-4 text-xs" style={{ color: '#6B6B6B' }}>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: '#16a34a' }} /> Aangenomen</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: '#dc2626' }} /> Afgewezen</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: '#d97706' }} /> Afgehaakt</span>
          </div>
        </div>
        <div className="space-y-3">
          {maandData.map(m => {
            const total = m.aangenomen + m.afgewezen + m.afgehaakt + m.niet_relevant
            const pct = (n: number) => maxMaand > 0 ? (n / maxMaand * 100).toFixed(1) : '0'
            return (
              <div key={m.key} className="flex items-center gap-3">
                <div className="w-16 flex-shrink-0 text-xs text-right capitalize" style={{ color: '#6B6B6B' }}>
                  {m.label}
                </div>
                <div className="flex-1 flex h-6 rounded overflow-hidden gap-px" style={{ backgroundColor: '#f3f4f6' }}>
                  {m.aangenomen > 0 && (
                    <div
                      className="h-full flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ width: `${pct(m.aangenomen)}%`, backgroundColor: '#16a34a', minWidth: 20 }}
                    >
                      {m.aangenomen}
                    </div>
                  )}
                  {m.afgewezen > 0 && (
                    <div
                      className="h-full flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ width: `${pct(m.afgewezen)}%`, backgroundColor: '#dc2626', minWidth: 20 }}
                    >
                      {m.afgewezen}
                    </div>
                  )}
                  {m.afgehaakt > 0 && (
                    <div
                      className="h-full flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ width: `${pct(m.afgehaakt)}%`, backgroundColor: '#d97706', minWidth: 20 }}
                    >
                      {m.afgehaakt}
                    </div>
                  )}
                </div>
                <div className="w-8 flex-shrink-0 text-xs text-right" style={{ color: total > 0 ? '#1A1A1A' : '#d1d5db' }}>
                  {total || '—'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Sectie 4: Performance per consultant ── */}
      <div className="rounded-lg bg-white shadow-sm border border-gray-100 p-5">
        <h2 className="text-base font-semibold mb-4" style={{ color: '#1A1A1A' }}>Performance per consultant</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                {['Consultant', 'In pijplijn', 'Aangenomen', 'Afgewezen', 'Afgesloten', 'Conversie'].map(h => (
                  <th key={h} className="pb-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B6B6B' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {consultantData.map((c, i) => (
                <tr
                  key={c.id}
                  style={{ borderBottom: i < consultantData.length - 1 ? '1px solid #f9fafb' : undefined }}
                >
                  <td className="py-3 font-medium" style={{ color: '#1A1A1A' }}>{c.name}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(203,173,116,0.15)', color: '#A68A52' }}>
                      {c.inPijplijn}
                    </span>
                  </td>
                  <td className="py-3 font-semibold" style={{ color: '#16a34a' }}>{c.aangenomen}</td>
                  <td className="py-3" style={{ color: '#dc2626' }}>{c.afgewezen}</td>
                  <td className="py-3" style={{ color: '#6B6B6B' }}>{c.afgesloten}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#f3f4f6', maxWidth: 60 }}>
                        <div
                          className="h-2 rounded-full"
                          style={{ width: `${c.conversiePercent}%`, backgroundColor: c.conversiePercent >= 50 ? '#16a34a' : '#CBAD74' }}
                        />
                      </div>
                      <span className="text-xs font-bold" style={{ color: '#1A1A1A' }}>{c.conversiePercent}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {consultantData.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-sm" style={{ color: '#9ca3af' }}>
                    Geen data beschikbaar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
