'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

type TabKey = 'alle' | 'verlopen' | 'vandaag' | 'morgen' | 'week' | 'later' | 'geen'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'alle',    label: 'Alle' },
  { key: 'verlopen', label: '🔴 Verlopen' },
  { key: 'vandaag',  label: 'Vandaag' },
  { key: 'morgen',   label: 'Morgen' },
  { key: 'week',     label: 'Komende 7 dagen' },
  { key: 'later',    label: 'Later' },
  { key: 'geen',     label: 'Geen deadline' },
]

const BADGE: Record<TabKey, { bg: string; color: string }> = {
  alle:     { bg: '#1A1A1A', color: '#fff' },
  verlopen: { bg: '#ef4444', color: '#fff' },
  vandaag:  { bg: '#CBAD74', color: '#1A1A1A' },
  morgen:   { bg: '#A68A52', color: '#fff' },
  week:     { bg: '#6B6B6B', color: '#fff' },
  later:    { bg: '#d1d5db', color: '#6B6B6B' },
  geen:     { bg: '#d1d5db', color: '#6B6B6B' },
}

interface Props {
  counts:    Record<string, number>
  activeTab: string
}

export function TakenTabs({ counts, activeTab }: Props) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  function goToTab(key: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', key)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="overflow-x-auto md:overflow-visible border-b border-gray-200 mb-5">
      <div className="flex min-w-max md:min-w-0 md:flex-wrap">
        {TABS.map(({ key, label }) => {
          const count    = counts[key] ?? 0
          const isActive = activeTab === key
          const hasItems = count > 0
          const bc       = BADGE[key]

          return (
            <button
              key={key}
              onClick={() => goToTab(key)}
              className="-mb-px flex items-center gap-1.5 px-4 py-2.5 text-sm whitespace-nowrap border-b-2 min-h-[44px] transition-colors"
              style={{
                borderColor: isActive ? '#CBAD74' : 'transparent',
                color:       isActive ? '#A68A52' : hasItems ? '#1A1A1A' : '#9ca3af',
                fontWeight:  isActive ? 600 : 400,
              }}
            >
              {label}
              <span
                className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                style={hasItems
                  ? { backgroundColor: bc.bg, color: bc.color }
                  : { backgroundColor: '#f3f4f6', color: '#9ca3af' }
                }
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
