'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  title: string
  icon?: string
  defaultOpen?: boolean
  children: React.ReactNode
}

export function CollapsibleSection({ title, icon, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-lg border border-gray-100 shadow-sm" style={{ backgroundColor: '#ffffff' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left"
        type="button"
      >
        <span className="font-medium text-base flex items-center gap-2" style={{ color: '#1A1A1A' }}>
          {icon && <span>{icon}</span>}
          {title}
        </span>
        {open
          ? <ChevronUp size={16} style={{ color: '#CBAD74' }} />
          : <ChevronDown size={16} style={{ color: '#6B6B6B' }} />
        }
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}
