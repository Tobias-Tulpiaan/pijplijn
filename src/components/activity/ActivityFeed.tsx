import { type ActivityEvent } from '@/lib/activityFeed'
import { format, formatDistanceToNow, isYesterday } from 'date-fns'
import { nl } from 'date-fns/locale'
import {
  User, Building2, Briefcase, CheckSquare, Users, MessageCircle,
  TrendingUp, Calendar, Activity, type LucideIcon,
} from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  User, Building2, Briefcase, CheckSquare, Users, MessageCircle, TrendingUp, Calendar, Activity,
}

interface Props {
  events: ActivityEvent[]
  emptyMessage?: string
}

export function ActivityFeed({ events, emptyMessage = 'Nog geen activiteit' }: Props) {
  if (events.length === 0) {
    return <p className="text-sm italic py-4" style={{ color: '#9ca3af' }}>{emptyMessage}</p>
  }

  return (
    <ul className="space-y-3">
      {events.map((event) => {
        const Icon = ICONS[event.icon] ?? Activity
        const isWa = event.type === 'whatsapp'

        return (
          <li key={`${event.type}-${event.id}`} className="flex gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: isWa ? 'rgba(37,211,102,0.12)' : 'rgba(203,173,116,0.15)',
                  color:           isWa ? '#075E54'               : '#A68A52',
                }}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex-grow min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm" style={{ color: '#1A1A1A' }}>
                  <span className="font-medium">{event.actorName}</span>
                  <span style={{ color: '#9ca3af' }}> · </span>
                  <span style={{ color: '#6B6B6B' }}>{event.description}</span>
                </p>
                <time
                  className="text-xs flex-shrink-0"
                  style={{ color: '#9ca3af' }}
                  title={format(event.timestamp, 'd MMMM yyyy HH:mm', { locale: nl })}
                >
                  {formatRelative(event.timestamp)}
                </time>
              </div>

              {isWa && typeof event.metadata?.body === 'string' && (
                <p
                  className="text-xs mt-1 line-clamp-2 whitespace-pre-line pl-2 border-l-2"
                  style={{ color: '#6B6B6B', borderColor: 'rgba(37,211,102,0.4)' }}
                >
                  {event.metadata.body}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function formatRelative(date: Date): string {
  const diffMs    = Date.now() - date.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  if (diffHours < 24)  return formatDistanceToNow(date, { locale: nl, addSuffix: true })
  if (isYesterday(date)) return `gisteren ${format(date, 'HH:mm')}`
  if (diffHours < 24 * 7) return format(date, 'EEEE HH:mm', { locale: nl })
  return format(date, 'd MMM yyyy', { locale: nl })
}
