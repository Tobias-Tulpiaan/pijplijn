'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { Shield, Check, Copy, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Step = 'loading' | 'scan' | 'verify' | 'codes' | 'done'

export default function TwoFactorSetupPage() {

  const [step,          setStep]         = useState<Step>('loading')
  const [qrDataUrl,     setQrDataUrl]    = useState('')
  const [secret,        setSecret]       = useState('')
  const [code,          setCode]         = useState('')
  const [recoveryCodes, setRecoveryCodes]= useState<string[]>([])
  const [confirmed,     setConfirmed]    = useState(false)
  const [error,         setError]        = useState('')
  const [loading,       setLoading]      = useState(false)
  const [navigating,    setNavigating]   = useState(false)
  const [copied,        setCopied]       = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/2fa/setup', { method: 'POST', signal: controller.signal })
      .then((r) => r.json())
      .then(({ secret, qrDataUrl }) => {
        setSecret(secret)
        setQrDataUrl(qrDataUrl)
        setStep('scan')
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setError('Kon QR-code niet laden. Herlaad de pagina.')
      })
    return () => controller.abort()
  }, [])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/2fa/verify-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Verificatie mislukt')
      setRecoveryCodes(data.recoveryCodes)
      setStep('codes')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout opgetreden')
    } finally {
      setLoading(false)
    }
  }

  async function handleDone() {
    setNavigating(true)
    window.location.href = '/pijplijn'
  }

  function copySecret() {
    navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadCodes() {
    const text = 'Tulpiaan Pijplijn — Recovery codes\n\n' + recoveryCodes.join('\n') + '\n\nBewaar deze codes veilig!'
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'recovery-codes-tulpiaan.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative" style={{ backgroundColor: '#F8F5EE' }}>
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="absolute top-4 right-4 text-sm hover:underline"
        style={{ color: '#6B6B6B', fontFamily: 'Aptos, Calibri, Arial, sans-serif' }}
      >
        Uitloggen
      </button>

      <div className="w-full max-w-md rounded-2xl shadow-md p-8" style={{ backgroundColor: '#ffffff', fontFamily: 'Aptos, Calibri, Arial, sans-serif' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(203,173,116,0.15)' }}>
            <Shield size={20} style={{ color: '#A68A52' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1A1A1A' }}>Tweestapsverificatie instellen</h1>
            <p className="text-xs" style={{ color: '#6B6B6B' }}>Beveilig je account extra</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-md text-sm border"
            style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' }}>
            {error}
          </div>
        )}

        {step === 'loading' && (
          <p className="text-sm text-center py-8" style={{ color: '#6B6B6B' }}>QR-code laden…</p>
        )}

        {step === 'scan' && (
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>Stap 1: Scan de QR-code</p>
              <p className="text-xs" style={{ color: '#6B6B6B' }}>
                Open Microsoft Authenticator, Google Authenticator of een andere TOTP-app en scan:
              </p>
              {qrDataUrl && (
                <div className="flex justify-center py-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="QR-code voor 2FA" width={200} height={200} />
                </div>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium" style={{ color: '#6B6B6B' }}>Of voer de code handmatig in:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded border text-xs font-mono break-all" style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb', color: '#1A1A1A' }}>
                  {secret}
                </code>
                <button onClick={copySecret} className="p-2 rounded hover:bg-gray-100 flex-shrink-0" title="Kopieer">
                  {copied ? <Check size={16} style={{ color: '#16a34a' }} /> : <Copy size={16} style={{ color: '#6B6B6B' }} />}
                </button>
              </div>
            </div>
            <Button onClick={() => setStep('verify')} className="w-full" style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}>
              Volgende: Verifieer code
            </Button>
          </div>
        )}

        {step === 'verify' && (
          <form onSubmit={handleVerify} className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>Stap 2: Voer je verificatiecode in</p>
              <p className="text-xs" style={{ color: '#6B6B6B' }}>Voer de 6-cijferige code in die je app toont:</p>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                required
                className="text-center text-lg tracking-[0.5em] font-mono"
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep('scan')} className="flex-1">
                Terug
              </Button>
              <Button
                type="submit"
                disabled={loading || code.length !== 6}
                className="flex-1"
                style={{ backgroundColor: loading || code.length !== 6 ? '#e5e7eb' : '#CBAD74', color: '#1A1A1A' }}
              >
                {loading ? 'Verifiëren…' : 'Verifieer en activeer'}
              </Button>
            </div>
          </form>
        )}

        {step === 'codes' && (
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>Stap 3: Sla je recovery codes op</p>
              <p className="text-xs" style={{ color: '#6B6B6B' }}>
                Als je geen toegang hebt tot je Authenticator, gebruik je een van deze codes. Elke code werkt maar één keer.
              </p>
              <div className="grid grid-cols-2 gap-1.5 p-3 rounded-md" style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
                {recoveryCodes.map((c, i) => (
                  <code key={i} className="text-xs font-mono py-1 px-2 rounded" style={{ backgroundColor: '#ffffff', color: '#1A1A1A', border: '1px solid #e5e7eb' }}>
                    {c}
                  </code>
                ))}
              </div>
              <button
                onClick={downloadCodes}
                className="flex items-center gap-1.5 text-xs hover:underline"
                style={{ color: '#A68A52' }}
              >
                <Download size={13} />
                Download als tekstbestand
              </button>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="w-4 h-4 accent-[#CBAD74]" />
              <span className="text-sm" style={{ color: '#1A1A1A' }}>Ja, ik heb mijn recovery codes opgeslagen</span>
            </label>
            <Button
              onClick={handleDone}
              disabled={!confirmed || navigating}
              className="w-full"
              style={{ backgroundColor: !confirmed || navigating ? '#e5e7eb' : '#CBAD74', color: '#1A1A1A' }}
            >
              {navigating ? 'Bezig…' : 'Ga naar dashboard'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
