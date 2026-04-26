'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, ShieldCheck, ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  totpEnabled:    boolean
  totpVerifiedAt: Date | null
}

export function TwoFactorSection({ totpEnabled, totpVerifiedAt }: Props) {
  const router  = useRouter()
  const [loading, setLoading]   = useState(false)
  const [error,   setError]     = useState('')
  const [confirm, setConfirm]   = useState(false)

  async function handleDisable() {
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/2fa/disable', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Fout bij uitschakelen')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout opgetreden')
    } finally {
      setLoading(false)
      setConfirm(false)
    }
  }

  const verifiedDate = totpVerifiedAt
    ? new Intl.DateTimeFormat('nl-NL', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(totpVerifiedAt))
    : null

  if (totpEnabled) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(22,163,74,0.1)' }}>
            <ShieldCheck size={18} style={{ color: '#16a34a' }} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>2FA is ingeschakeld</p>
            {verifiedDate && (
              <p className="text-xs" style={{ color: '#6B6B6B' }}>Ingesteld op {verifiedDate}</p>
            )}
          </div>
        </div>

        {error && (
          <p className="text-sm" style={{ color: '#991b1b' }}>{error}</p>
        )}

        {!confirm ? (
          <button
            onClick={() => setConfirm(true)}
            className="text-xs hover:underline"
            style={{ color: '#6B6B6B' }}
          >
            2FA uitschakelen
          </button>
        ) : (
          <div className="p-3 rounded-md border space-y-3" style={{ borderColor: '#fecaca', backgroundColor: '#fef2f2' }}>
            <p className="text-sm font-medium" style={{ color: '#991b1b' }}>
              Weet je zeker dat je 2FA wilt uitschakelen? Je account wordt minder beveiligd.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleDisable}
                disabled={loading}
                variant="outline"
                className="text-xs h-8"
                style={{ borderColor: '#fca5a5', color: '#991b1b' }}
              >
                {loading ? 'Bezig…' : 'Ja, uitschakelen'}
              </Button>
              <Button
                onClick={() => setConfirm(false)}
                variant="outline"
                className="text-xs h-8"
              >
                Annuleren
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(203,173,116,0.12)' }}>
          <ShieldOff size={18} style={{ color: '#6B6B6B' }} />
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>2FA is niet ingeschakeld</p>
          <p className="text-xs" style={{ color: '#6B6B6B' }}>
            Beveilig je account met een Authenticator-app.
          </p>
        </div>
      </div>
      <Button
        onClick={() => router.push('/2fa/setup')}
        className="text-sm"
        style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}
      >
        <Shield size={14} className="mr-1.5" />
        2FA instellen
      </Button>
    </div>
  )
}
