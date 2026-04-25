'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  initialValue: string
}

export function InvoiceUrlForm({ initialValue }: Props) {
  const [value, setValue] = useState(initialValue)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)
    try {
      const res = await fetch('/api/settings/invoiceUrl', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Opslaan mislukt')
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>
          URL facturenprogramma
        </label>
        <input
          type="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
          className="w-full px-3 py-2 rounded-md border text-sm outline-none focus:ring-2"
          style={{ borderColor: '#d1d5db', color: '#1A1A1A' }}
        />
        <p className="mt-1 text-xs" style={{ color: '#6B6B6B' }}>
          Deze URL wordt geopend via de "Factureer"-knop op de kandidaat-detailpagina.
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-md text-sm border"
          style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="px-4 py-3 rounded-md text-sm border"
          style={{ backgroundColor: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0' }}>
          Opgeslagen
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        style={{ backgroundColor: loading ? '#e5e7eb' : '#CBAD74', color: '#1A1A1A' }}
      >
        {loading ? 'Opslaan…' : 'Opslaan'}
      </Button>
    </form>
  )
}
