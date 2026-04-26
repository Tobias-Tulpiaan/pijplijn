export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Settings, Shield } from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getSetting } from '@/lib/settings'
import { InvoiceUrlForm } from '@/components/instellingen/InvoiceUrlForm'
import { WachtwoordForm } from '@/components/instellingen/WachtwoordForm'
import { TwoFactorSection } from '@/components/instellingen/TwoFactorSection'

export default async function InstellingenPage() {
  const session    = await auth()
  const invoiceUrl = await getSetting('invoiceUrl', 'https://secure20.e-boekhouden.nl/bh/inloggen.asp')

  const dbUser = session?.user?.id
    ? await prisma.user.findUnique({
        where:  { id: session.user.id },
        select: { totpEnabled: true, totpVerifiedAt: true },
      })
    : null

  return (
    <div style={{ fontFamily: 'Aptos, Calibri, Arial, sans-serif', maxWidth: 640 }}>
      <div className="flex items-center gap-2 mb-6">
        <Settings size={22} style={{ color: '#6B6B6B' }} />
        <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Instellingen</h1>
      </div>

      <div className="space-y-6">
        {/* Algemene instellingen */}
        <div className="rounded-lg p-6 shadow-sm border border-gray-100" style={{ backgroundColor: '#ffffff' }}>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#A68A52' }}>Algemene instellingen</h2>
          <InvoiceUrlForm initialValue={invoiceUrl} />
        </div>

        {/* Mijn account */}
        <div className="rounded-lg p-6 shadow-sm border border-gray-100" style={{ backgroundColor: '#ffffff' }}>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#A68A52' }}>Mijn account</h2>

          <div className="mb-5 pb-5 border-b border-gray-100 space-y-1">
            <div className="flex gap-2 text-sm">
              <span className="font-medium" style={{ color: '#6B6B6B' }}>Naam:</span>
              <span style={{ color: '#1A1A1A' }}>{session?.user?.name}</span>
            </div>
            <div className="flex gap-2 text-sm">
              <span className="font-medium" style={{ color: '#6B6B6B' }}>E-mail:</span>
              <span style={{ color: '#1A1A1A' }}>{session?.user?.email}</span>
            </div>
          </div>

          <WachtwoordForm />
        </div>

        {/* Tweestapsverificatie */}
        <div className="rounded-lg p-6 shadow-sm border border-gray-100" style={{ backgroundColor: '#ffffff' }}>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#A68A52' }}>Tweestapsverificatie (2FA)</h2>
          <TwoFactorSection
            totpEnabled={dbUser?.totpEnabled ?? false}
            totpVerifiedAt={dbUser?.totpVerifiedAt ?? null}
          />
        </div>

        {/* Audit log */}
        <div className="rounded-lg p-6 shadow-sm border border-gray-100" style={{ backgroundColor: '#ffffff' }}>
          <h2 className="text-base font-semibold mb-1" style={{ color: '#A68A52' }}>Audit log</h2>
          <p className="text-sm mb-4" style={{ color: '#6B6B6B' }}>
            Overzicht van activiteiten en wijzigingen in het systeem.
          </p>
          <Link
            href="/audit"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors hover:opacity-90"
            style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}
          >
            <Shield size={15} />
            Bekijk audit log
          </Link>
        </div>
      </div>
    </div>
  )
}
