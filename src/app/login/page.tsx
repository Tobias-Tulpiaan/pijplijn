'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Shield } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [step, setStep]             = useState<'credentials' | 'totp'>('credentials')
  const [savedEmail, setSavedEmail]       = useState('')
  const [savedPassword, setSavedPassword] = useState('')
  const [totpCode, setTotpCode]     = useState('')
  const [useRecoveryCode, setUseRecoveryCode] = useState(false)

  async function handleCredentials(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = e.currentTarget
    const email    = (form.elements.namedItem('email')    as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    const result = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)

    if (result?.code === 'REQUIRES_TOTP') {
      setSavedEmail(email)
      setSavedPassword(password)
      setStep('totp')
      return
    }

    if (!result?.error) {
      window.location.href = '/'
      return
    }

    if (result.error === 'CallbackRouteError') {
      setError('Te veel inlogpogingen. Probeer later opnieuw.')
    } else {
      setError('Ongeldig e-mailadres of wachtwoord.')
    }
  }

  async function handleTotp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn('credentials', {
      email:     savedEmail,
      password:  savedPassword,
      totpCode:  totpCode.replace(/\s/g, ''),
      redirect:  false,
    })

    setLoading(false)

    if (!result?.error) {
      window.location.href = '/'
      return
    }

    setError(useRecoveryCode ? 'Recovery code is ongeldig of al gebruikt.' : 'Ongeldige code. Probeer opnieuw.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8F5EE' }}>
      <div className="w-full max-w-sm rounded-2xl shadow-md p-8" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#CBAD74', fontFamily: 'Aptos, Calibri, Arial, sans-serif' }}>
            Tulpiaan
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6B6B6B' }}>Pijplijn Dashboard</p>
        </div>

        {step === 'credentials' && (
          <form onSubmit={handleCredentials} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" style={{ color: '#1A1A1A' }}>E-mailadres</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required placeholder="naam@tulpiaan.nl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" style={{ color: '#1A1A1A' }}>Wachtwoord</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required placeholder="••••••••" />
            </div>
            {error && <p className="text-sm" style={{ color: '#991b1b' }}>{error}</p>}
            <Button
              type="submit"
              disabled={loading}
              className="w-full font-semibold"
              style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}
            >
              {loading ? 'Bezig…' : 'Inloggen'}
            </Button>
          </form>
        )}

        {step === 'totp' && (
          <form onSubmit={handleTotp} className="space-y-5">
            <div className="flex flex-col items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(203,173,116,0.15)' }}>
                <Shield size={20} style={{ color: '#A68A52' }} />
              </div>
              <p className="text-sm font-medium text-center" style={{ color: '#1A1A1A' }}>
                {useRecoveryCode ? 'Recovery code' : 'Tweestapsverificatie'}
              </p>
              <p className="text-xs text-center" style={{ color: '#6B6B6B' }}>
                {useRecoveryCode
                  ? 'Voer een van je opgeslagen recovery codes in.'
                  : 'Voer de 6-cijferige code in van je Authenticator-app.'}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="totpCode" style={{ color: '#1A1A1A' }}>
                {useRecoveryCode ? 'Recovery code' : 'Verificatiecode'}
              </Label>
              {useRecoveryCode ? (
                <Input
                  key="recovery"
                  id="totpCode"
                  type="text"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX-XXXX"
                  autoFocus
                  autoComplete="off"
                  required
                  className="text-center text-lg font-mono"
                />
              ) : (
                <Input
                  key="totp"
                  id="totpCode"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  autoFocus
                  autoComplete="one-time-code"
                  required
                  className="text-center text-lg tracking-[0.5em] font-mono"
                />
              )}
            </div>
            {error && <p className="text-sm" style={{ color: '#991b1b' }}>{error}</p>}
            <Button
              type="submit"
              disabled={loading || (useRecoveryCode ? totpCode.length < 14 : totpCode.length !== 6)}
              className="w-full font-semibold"
              style={{
                backgroundColor: loading || (useRecoveryCode ? totpCode.length < 14 : totpCode.length !== 6) ? '#e5e7eb' : '#CBAD74',
                color: '#1A1A1A',
              }}
            >
              {loading ? 'Verifiëren…' : (useRecoveryCode ? 'Verifieer recovery code' : 'Bevestigen')}
            </Button>
            <button
              type="button"
              onClick={() => { setStep('credentials'); setError(''); setTotpCode(''); setUseRecoveryCode(false) }}
              className="w-full text-xs text-center hover:underline"
              style={{ color: '#6B6B6B' }}
            >
              Terug naar inloggen
            </button>
            <button
              type="button"
              onClick={() => { setUseRecoveryCode(!useRecoveryCode); setTotpCode(''); setError('') }}
              className="w-full text-xs text-center hover:underline"
              style={{ color: '#A68A52' }}
            >
              {useRecoveryCode
                ? '← Terug naar Authenticator code'
                : 'Geen toegang tot Authenticator? Gebruik recovery code'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
