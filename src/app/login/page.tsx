'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('Ongeldig e-mailadres of wachtwoord.')
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#F8F5EE' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl shadow-md p-8"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        {/* Logo / titel */}
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: '#CBAD74', fontFamily: 'Aptos, Calibri, Arial, sans-serif' }}
          >
            Tulpiaan
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: '#6B6B6B' }}
          >
            Pijplijn Dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email" style={{ color: '#1A1A1A' }}>
              E-mailadres
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="naam@tulpiaan.nl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" style={{ color: '#1A1A1A' }}>
              Wachtwoord
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full font-semibold"
            style={{
              backgroundColor: '#CBAD74',
              color: '#1A1A1A',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#A68A52'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#CBAD74'
            }}
          >
            {loading ? 'Bezig…' : 'Inloggen'}
          </Button>
        </form>
      </div>
    </div>
  )
}
