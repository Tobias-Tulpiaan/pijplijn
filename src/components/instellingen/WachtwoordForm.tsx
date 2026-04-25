'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function WachtwoordForm() {
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function validate(): string {
    if (newPassword.length < 8) return 'Wachtwoord moet minimaal 8 tekens zijn'
    if (newPassword !== confirm) return 'Wachtwoorden komen niet overeen'
    return ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    const validationError = validate()
    if (validationError) { setError(validationError); return }
    setLoading(true)
    try {
      const res = await fetch('/api/users/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Wijzigen mislukt')
      }
      setSuccess(true)
      setNewPassword('')
      setConfirm('')
      setTimeout(() => setSuccess(false), 5000)
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
          Nieuw wachtwoord
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={8}
          required
          className="w-full px-3 py-2 rounded-md border text-sm outline-none focus:ring-2"
          style={{ borderColor: '#d1d5db', color: '#1A1A1A' }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>
          Bevestig nieuw wachtwoord
        </label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          minLength={8}
          required
          className="w-full px-3 py-2 rounded-md border text-sm outline-none focus:ring-2"
          style={{ borderColor: '#d1d5db', color: '#1A1A1A' }}
        />
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
          Wachtwoord gewijzigd. Log de volgende keer in met je nieuwe wachtwoord.
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        style={{ backgroundColor: loading ? '#e5e7eb' : '#CBAD74', color: '#1A1A1A' }}
      >
        {loading ? 'Wijzigen…' : 'Wachtwoord wijzigen'}
      </Button>
    </form>
  )
}
