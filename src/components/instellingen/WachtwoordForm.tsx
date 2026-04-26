'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'
import { passwordRules } from '@/lib/validators'

function StrengthScore(password: string): number {
  return [
    passwordRules.minLength(password),
    passwordRules.hasUpper(password),
    passwordRules.hasLower(password),
    passwordRules.hasDigit(password),
    passwordRules.hasSpecial(password),
    passwordRules.noSpaces(password),
  ].filter(Boolean).length
}

const rules = [
  { key: 'minLength', label: 'Minimaal 12 tekens' },
  { key: 'hasUpper',  label: 'Minimaal 1 hoofdletter' },
  { key: 'hasLower',  label: 'Minimaal 1 kleine letter' },
  { key: 'hasDigit',  label: 'Minimaal 1 cijfer' },
  { key: 'hasSpecial',label: 'Minimaal 1 speciaal teken' },
  { key: 'noSpaces',  label: 'Geen spaties' },
] as const

export function WachtwoordForm() {
  const [newPassword, setNewPassword] = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState(false)

  const allPassed = rules.every((r) => passwordRules[r.key](newPassword))
  const score     = StrengthScore(newPassword)
  const strengthLabel = score <= 2 ? 'Zwak' : score <= 4 ? 'Gemiddeld' : 'Sterk'
  const strengthColor = score <= 2 ? '#dc2626' : score <= 4 ? '#d97706' : '#16a34a'
  const canSubmit = allPassed && newPassword === confirm

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    if (!allPassed) { setError('Voldoe aan alle wachtwoordvereisten'); return }
    if (newPassword !== confirm) { setError('Wachtwoorden komen niet overeen'); return }
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
          required
          className="w-full px-3 py-2 rounded-md border text-sm outline-none focus:ring-2"
          style={{ borderColor: '#d1d5db', color: '#1A1A1A' }}
        />

        {/* Sterkte-indicator */}
        {newPassword.length > 0 && (
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${(score / 6) * 100}%`, backgroundColor: strengthColor }}
                />
              </div>
              <span className="text-xs font-medium" style={{ color: strengthColor }}>{strengthLabel}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              {rules.map((r) => {
                const passed = passwordRules[r.key](newPassword)
                return (
                  <div key={r.key} className="flex items-center gap-1.5 text-xs">
                    {passed
                      ? <Check size={12} style={{ color: '#16a34a', flexShrink: 0 }} />
                      : <X size={12} style={{ color: '#dc2626', flexShrink: 0 }} />}
                    <span style={{ color: passed ? '#16a34a' : '#6B6B6B' }}>{r.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>
          Bevestig nieuw wachtwoord
        </label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          className="w-full px-3 py-2 rounded-md border text-sm outline-none focus:ring-2"
          style={{
            borderColor: confirm.length > 0 && confirm !== newPassword ? '#dc2626' : '#d1d5db',
            color: '#1A1A1A',
          }}
        />
        {confirm.length > 0 && confirm !== newPassword && (
          <p className="text-xs mt-1" style={{ color: '#dc2626' }}>Wachtwoorden komen niet overeen</p>
        )}
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
          Wachtwoord gewijzigd.
        </div>
      )}

      <Button
        type="submit"
        disabled={loading || !canSubmit}
        style={{ backgroundColor: loading || !canSubmit ? '#e5e7eb' : '#CBAD74', color: '#1A1A1A' }}
      >
        {loading ? 'Wijzigen…' : 'Wachtwoord wijzigen'}
      </Button>
    </form>
  )
}
