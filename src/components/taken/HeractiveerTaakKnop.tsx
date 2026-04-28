'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw } from 'lucide-react'

export function HeractiveerTaakKnop({ taskId }: { taskId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleHeractiveer() {
    setLoading(true)
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: false }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleHeractiveer}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors hover:bg-gray-50 disabled:opacity-50"
      style={{ borderColor: '#e5e7eb', color: '#6B6B6B' }}
      title="Heractiveren"
    >
      <RotateCcw size={12} />
      {loading ? 'Bezig...' : 'Heractiveren'}
    </button>
  )
}
