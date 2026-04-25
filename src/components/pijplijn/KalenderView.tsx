'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isSameDay,
  addMonths, subMonths, format, parseISO, isAfter, startOfDay,
} from 'date-fns'
import { nl } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export type CalEvent = {
  id: string
  date: string
  type: 'gesprek' | 'taak' | 'start'
  label: string
  href: string
}

const eventStyle: Record<CalEvent['type'], { bg: string; color: string }> = {
  gesprek: { bg: '#CBAD74', color: '#1A1A1A' },
  taak: { bg: '#6B6B6B', color: '#ffffff' },
  start: { bg: '#16a34a', color: '#ffffff' },
}

const DAGnamen = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

interface KalenderViewProps {
  events: CalEvent[]
}

export function KalenderView({ events }: KalenderViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const today = new Date()

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  function eventsForDay(day: Date) {
    return events.filter((e) => isSameDay(parseISO(e.date), day))
  }

  // Agenda: events in current month, sorted by date, only upcoming/today
  const agendaEvents = events
    .filter((e) => {
      const d = parseISO(e.date)
      return isSameMonth(d, currentMonth) || isAfter(d, startOfDay(today))
    })
    .filter((e) => isSameMonth(parseISO(e.date), currentMonth))
    .sort((a, b) => a.date.localeCompare(b.date))

  const agendaByDay: { day: Date; events: typeof events }[] = []
  for (const event of agendaEvents) {
    const d = parseISO(event.date)
    const last = agendaByDay[agendaByDay.length - 1]
    if (last && isSameDay(last.day, d)) last.events.push(event)
    else agendaByDay.push({ day: d, events: [event] })
  }

  return (
    <div className="rounded-lg overflow-hidden shadow-sm" style={{ backgroundColor: '#ffffff' }}>
      {/* Navigatie header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-gray-100"
        style={{ backgroundColor: '#ffffff' }}
      >
        <button
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Vorige maand"
        >
          <ChevronLeft size={18} style={{ color: '#6B6B6B' }} />
        </button>

        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold capitalize" style={{ color: '#1A1A1A' }}>
            {format(currentMonth, 'MMMM yyyy', { locale: nl })}
          </h2>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 py-1 rounded-md text-xs font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
            style={{ color: '#6B6B6B' }}
          >
            Vandaag
          </button>
        </div>

        <button
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Volgende maand"
        >
          <ChevronRight size={18} style={{ color: '#6B6B6B' }} />
        </button>
      </div>

      {/* Dag-headers — desktop only */}
      <div className="hidden md:grid grid-cols-7 border-b border-gray-100">
        {DAGnamen.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-semibold uppercase tracking-wide"
            style={{ color: '#6B6B6B' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Kalender grid — desktop only */}
      <div className="hidden md:grid grid-cols-7">
        {days.map((day, i) => {
          const dayEvents = eventsForDay(day)
          const isToday = isSameDay(day, today)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isLast = i === days.length - 1

          return (
            <div
              key={day.toISOString()}
              className="min-h-[90px] p-1.5 border-b border-r border-gray-100 flex flex-col"
              style={{
                borderRight: (i + 1) % 7 === 0 ? 'none' : undefined,
                borderBottom: i >= days.length - 7 ? 'none' : undefined,
                backgroundColor: isToday ? 'rgba(203,173,116,0.08)' : undefined,
                outline: isToday ? '2px solid #CBAD74' : undefined,
                outlineOffset: '-1px',
              }}
            >
              <span
                className="text-xs font-medium self-end mb-1 w-6 h-6 flex items-center justify-center rounded-full"
                style={{
                  color: !isCurrentMonth ? '#d1d5db' : isToday ? '#1A1A1A' : '#6B6B6B',
                  backgroundColor: isToday ? '#CBAD74' : undefined,
                }}
              >
                {format(day, 'd')}
              </span>

              <div className="flex flex-col gap-0.5">
                {dayEvents.slice(0, 3).map((event) => (
                  <Link
                    key={event.id}
                    href={event.href}
                    onClick={(e) => e.stopPropagation()}
                    className="px-1.5 py-0.5 rounded text-xs truncate hover:opacity-80 transition-opacity"
                    style={{
                      backgroundColor: eventStyle[event.type].bg,
                      color: eventStyle[event.type].color,
                    }}
                    title={event.label}
                  >
                    {event.label}
                  </Link>
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-xs px-1" style={{ color: '#6B6B6B' }}>
                    +{dayEvents.length - 3} meer
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile agenda */}
      <div className="md:hidden divide-y divide-gray-100">
        {agendaByDay.length === 0 ? (
          <div className="py-8 text-center text-sm" style={{ color: '#9ca3af' }}>
            Geen evenementen deze maand
          </div>
        ) : (
          agendaByDay.map(({ day, events: dayEvents }) => (
            <div key={day.toISOString()} className="px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    backgroundColor: isSameDay(day, today) ? '#CBAD74' : '#f3f4f6',
                    color: isSameDay(day, today) ? '#1A1A1A' : '#6B6B6B',
                  }}
                >
                  {format(day, 'd')}
                </span>
                <span className="text-xs font-medium capitalize" style={{ color: '#6B6B6B' }}>
                  {format(day, 'EEEE', { locale: nl })}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 pl-9">
                {dayEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={event.href}
                    className="px-2.5 py-1.5 rounded-md text-sm font-medium hover:opacity-80 transition-opacity"
                    style={{
                      backgroundColor: eventStyle[event.type].bg,
                      color: eventStyle[event.type].color,
                    }}
                  >
                    {event.label}
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 px-4 py-3 border-t border-gray-100">
        {(['gesprek', 'taak', 'start'] as const).map((type) => (
          <div key={type} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: eventStyle[type].bg }}
            />
            <span className="text-xs capitalize" style={{ color: '#6B6B6B' }}>
              {type === 'gesprek' ? 'Gesprek' : type === 'taak' ? 'Taak' : 'Startdatum'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
