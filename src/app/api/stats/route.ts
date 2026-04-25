export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import {
  startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear,
  format, differenceInDays,
} from 'date-fns'
import { nl } from 'date-fns/locale'
import { STAGES } from '@/types'

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

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const period   = searchParams.get('period')   ?? 'this_month'
  const ownerId  = searchParams.get('ownerId')  ?? ''

  const range = getPeriodRange(period)
  const now   = new Date()

  const ownerFilter = ownerId ? { ownerId } : {}
  const rangeFilter = range   ? { gte: range.start, lte: range.end } : undefined

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

  // Kengetallen
  const aangenomen      = archivedInPeriod.filter(c => c.archivedReason === 'aangenomen').length
  const afgewezen       = archivedInPeriod.filter(c => c.archivedReason === 'afgewezen').length
  const afgehaakt       = archivedInPeriod.filter(c => c.archivedReason === 'afgehaakt').length
  const nietRelevant    = archivedInPeriod.filter(c => c.archivedReason === 'niet_relevant').length
  const totalAfgesloten = aangenomen + afgewezen + afgehaakt + nietRelevant
  const conversiePercent = totalAfgesloten > 0 ? Math.round(aangenomen / totalAfgesloten * 100) : 0

  const aangenomenCandidates = archivedInPeriod.filter(c => c.archivedReason === 'aangenomen' && c.archivedAt)
  const avgDoorlooptijdDagen = aangenomenCandidates.length > 0
    ? Math.round(aangenomenCandidates.reduce((sum, c) => sum + differenceInDays(c.archivedAt!, c.createdAt), 0) / aangenomenCandidates.length)
    : null

  // Funnel
  const funnelData = STAGES.map((stage, i) => {
    const count = stage.pct === 10
      ? candidatesInPeriod
      : new Set(stageHistoryInPeriod.filter(h => h.toStage === stage.pct).map(h => h.candidateId)).size
    return { stage: stage.pct, label: stage.label, count }
  })
  const maxCount = funnelData[0]?.count || 1
  const funnelWithMeta = funnelData.map(f => ({
    ...f,
    barWidth: maxCount > 0 ? Math.round(f.count / maxCount * 100) : 0,
    conversionPct: maxCount > 0 ? Math.round(f.count / maxCount * 100) : 0,
  }))

  // Monthly data (last 6 months)
  const maandData = Array.from({ length: 6 }, (_, i) => {
    const d       = subMonths(now, 5 - i)
    const key     = format(d, 'yyyy-MM')
    const label   = format(d, 'MMM yyyy', { locale: nl })
    const entries = archived6Months.filter(c => c.archivedAt && format(c.archivedAt, 'yyyy-MM') === key)
    return {
      key,
      label,
      aangenomen:    entries.filter(c => c.archivedReason === 'aangenomen').length,
      afgewezen:     entries.filter(c => c.archivedReason === 'afgewezen').length,
      afgehaakt:     entries.filter(c => c.archivedReason === 'afgehaakt').length,
      niet_relevant: entries.filter(c => c.archivedReason === 'niet_relevant').length,
    }
  })

  // Per consultant
  const consultantData = users.map(u => {
    const inPijplijn   = activeByOwner.find(g => g.ownerId === u.id)?._count.id ?? 0
    const userArchived = archivedInPeriod.filter(c => c.ownerId === u.id)
    const ua           = userArchived.filter(c => c.archivedReason === 'aangenomen').length
    const uw           = userArchived.filter(c => c.archivedReason === 'afgewezen').length
    const uh           = userArchived.filter(c => c.archivedReason === 'afgehaakt').length
    const un           = userArchived.filter(c => c.archivedReason === 'niet_relevant').length
    const totaal       = ua + uw + uh + un
    return {
      id: u.id,
      name: u.name,
      inPijplijn,
      aangenomen: ua,
      afgewezen: uw,
      afgesloten: totaal,
      conversiePercent: totaal > 0 ? Math.round(ua / totaal * 100) : 0,
    }
  }).sort((a, b) => b.aangenomen - a.aangenomen)

  return NextResponse.json({
    activeCount,
    aangenomen,
    conversiePercent,
    avgDoorlooptijdDagen,
    funnel: funnelWithMeta,
    maandData,
    consultantData,
    users,
  })
}
