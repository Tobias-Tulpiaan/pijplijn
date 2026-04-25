'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw } from 'lucide-react'

export function HeractiveerKnop({ candidateId }: { candidateId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)

  async function heractiveer() {
    setLoading(true)
    try {
      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: false }),
      })
      if (!res.ok) throw new Error()
      router.push('/pijplijn')
      router.refresh()
    } catch {
      setLoading(false)
      setConfirm(false)
    }
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors hover:bg-green-50"
        style={{ color: '#16a34a', borderColor: '#16a34a' }}
      >
        <RotateCcw size={13} />
        Heractiveren
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs" style={{ color: '#6B6B6B' }}>Zeker?</span>
      <button
        onClick={heractiveer}
        disabled={loading}
        className="px-3 py-1.5 rounded-md text-sm font-medium text-white"
        style={{ backgroundColor: loading ? '#e5e7eb' : '#16a34a' }}
      >
        {loading ? 'Bezig…' : 'Ja, heractiveer'}
      </button>
      <button
        onClick={() => setConfirm(false)}
        className="px-2 py-1.5 rounded-md text-sm hover:bg-gray-100"
        style={{ color: '#6B6B6B' }}
      >
        Nee
      </button>
    </div>
  )
}
