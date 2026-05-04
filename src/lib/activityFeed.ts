import { prisma } from './prisma'

export type ActivityEvent = {
  id: string
  type: 'audit' | 'whatsapp'
  action: string
  timestamp: Date
  actorName: string
  description: string
  metadata?: Record<string, unknown>
  icon: string
}

export async function getCandidateActivity(candidateId: string, limit = 50): Promise<ActivityEvent[]> {
  const taskIds = (await prisma.task.findMany({
    where: { candidateId },
    select: { id: true },
  })).map((t) => t.id)

  const [auditLogs, messages] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        OR: [
          { entityType: 'candidate', entityId: candidateId },
          ...(taskIds.length > 0 ? [{ entityType: 'task', entityId: { in: taskIds } }] : []),
        ],
      },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.whatsappMessage.findMany({
      where: { recipientType: 'candidate', recipientId: candidateId },
      include: { sentBy: { select: { name: true } }, template: { select: { name: true } } },
      orderBy: { sentAt: 'desc' },
      take: limit,
    }),
  ])

  const events: ActivityEvent[] = [
    ...auditLogs.map((log) => ({
      id: log.id,
      type: 'audit' as const,
      action: log.action,
      timestamp: log.createdAt,
      actorName: log.user?.name || 'Systeem',
      description: humanizeAction(log.action, log.metadata as Record<string, unknown>),
      metadata: log.metadata as Record<string, unknown>,
      icon: iconForAction(log.action),
    })),
    ...messages.map((msg) => ({
      id: msg.id,
      type: 'whatsapp' as const,
      action: 'send_whatsapp',
      timestamp: msg.sentAt,
      actorName: msg.sentBy.name,
      description: `WhatsApp verzonden${msg.template ? `: ${msg.template.name}` : ' (eigen bericht)'}`,
      metadata: { body: msg.body },
      icon: 'MessageCircle',
    })),
  ]

  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit)
}

export async function getCompanyActivity(companyId: string, limit = 50): Promise<ActivityEvent[]> {
  const [vacatureIds, contactIds] = await Promise.all([
    prisma.vacature.findMany({ where: { companyId }, select: { id: true } }).then((v) => v.map((x) => x.id)),
    prisma.contact.findMany({ where: { companyId }, select: { id: true } }).then((c) => c.map((x) => x.id)),
  ])

  const [auditLogs, messages] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        OR: [
          { entityType: 'company', entityId: companyId },
          ...(vacatureIds.length > 0 ? [{ entityType: 'vacature', entityId: { in: vacatureIds } }] : []),
          ...(contactIds.length > 0 ? [{ entityType: 'contact', entityId: { in: contactIds } }] : []),
        ],
      },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    contactIds.length > 0
      ? prisma.whatsappMessage.findMany({
          where: { recipientType: 'contact', recipientId: { in: contactIds } },
          include: { sentBy: { select: { name: true } }, template: { select: { name: true } } },
          orderBy: { sentAt: 'desc' },
          take: limit,
        })
      : Promise.resolve([]),
  ])

  const events: ActivityEvent[] = [
    ...auditLogs.map((log) => ({
      id: log.id,
      type: 'audit' as const,
      action: log.action,
      timestamp: log.createdAt,
      actorName: log.user?.name || 'Systeem',
      description: humanizeAction(log.action, log.metadata as Record<string, unknown>),
      metadata: log.metadata as Record<string, unknown>,
      icon: iconForAction(log.action),
    })),
    ...messages.map((msg) => ({
      id: msg.id,
      type: 'whatsapp' as const,
      action: 'send_whatsapp',
      timestamp: msg.sentAt,
      actorName: msg.sentBy.name,
      description: `WhatsApp verzonden${msg.template ? `: ${msg.template.name}` : ' (eigen bericht)'}`,
      metadata: { body: msg.body },
      icon: 'MessageCircle',
    })),
  ]

  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit)
}

function humanizeAction(action: string, metadata?: Record<string, unknown>): string {
  switch (action) {
    case 'candidate_create':       return 'Kandidaat aangemaakt'
    case 'candidate_update':       return 'Kandidaat-gegevens bijgewerkt'
    case 'candidate_stage_change': {
      const from = metadata?.from
      const to   = metadata?.to
      return from != null && to != null ? `Stage gewijzigd: ${from}% → ${to}%` : 'Stage gewijzigd'
    }
    case 'candidate_archive':      return 'Kandidaat gearchiveerd'
    case 'candidate_unarchive':    return 'Kandidaat heractiveerd'
    case 'candidate_delete':       return 'Kandidaat verwijderd'
    case 'company_create':         return 'Opdrachtgever aangemaakt'
    case 'company_update':         return 'Opdrachtgever bijgewerkt'
    case 'company_delete':         return 'Opdrachtgever verwijderd'
    case 'vacature_create':        return 'Vacature aangemaakt'
    case 'vacature_update':        return 'Vacature bijgewerkt'
    case 'vacature_delete':        return 'Vacature verwijderd'
    case 'vacature_content_generated': {
      const scope = metadata?.scope as string | undefined
      const version = metadata?.version as number | undefined
      const scopeLabel = scope === 'all' ? 'alles' : scope ?? 'content'
      return `Content gegenereerd${version ? ` (versie ${version}` : ''}${scope && scope !== 'all' ? `, ${scopeLabel}` : ''}${version ? ')' : ''}`
    }
    case 'vacature_content_restored': {
      const version = metadata?.version as number | undefined
      return `Content hersteld${version ? ` naar versie ${version}` : ''}`
    }
    case 'vacature_content_failed': return 'Contentgeneratie mislukt'
    case 'create_task':            return 'Taak aangemaakt'
    case 'complete_task':          return 'Taak afgevinkt'
    case 'reactivate_task':        return 'Taak heractiveerd'
    case 'delete_task':            return 'Taak verwijderd'
    case 'create_contact':         return 'Contactpersoon toegevoegd'
    case 'update_contact':         return 'Contactpersoon bijgewerkt'
    case 'delete_contact':         return 'Contactpersoon verwijderd'
    case 'update_dates':           return 'Datums aangepast'
    case 'send_whatsapp':          return 'WhatsApp verzonden'
    default:                       return action.replace(/_/g, ' ')
  }
}

function iconForAction(action: string): string {
  if (action.startsWith('candidate')) return 'User'
  if (action.startsWith('company'))   return 'Building2'
  if (action.startsWith('vacature'))  return 'Briefcase'
  if (action.includes('task'))        return 'CheckSquare'
  if (action.includes('contact'))     return 'Users'
  if (action.includes('whatsapp'))    return 'MessageCircle'
  if (action.includes('stage'))       return 'TrendingUp'
  if (action.includes('date'))        return 'Calendar'
  return 'Activity'
}
