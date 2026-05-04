'use client'

import { useState } from 'react'
import { RecruitmentContentTab } from './recruitment-content/RecruitmentContentTab'

interface Props {
  vacatureId: string
  overzichtContent: React.ReactNode
  rechterkolom: React.ReactNode
}

const TABS = [
  { key: 'overzicht', label: 'Overzicht' },
  { key: 'recruitment', label: 'Recruitment content' },
] as const

type TabKey = (typeof TABS)[number]['key']

export function VacatureTabs({ vacatureId, overzichtContent, rechterkolom }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('overzicht')

  return (
    <>
      {/* Tab navigatie */}
      <div className="flex gap-0 border-b border-gray-200 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
            style={{
              borderBottomColor: activeTab === tab.key ? '#CBAD74' : 'transparent',
              color: activeTab === tab.key ? '#A68A52' : '#6B6B6B',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overzicht' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">{overzichtContent}</div>
          <div className="space-y-4">{rechterkolom}</div>
        </div>
      )}

      {activeTab === 'recruitment' && (
        <RecruitmentContentTab vacatureId={vacatureId} />
      )}
    </>
  )
}
