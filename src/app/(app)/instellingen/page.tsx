export const dynamic = 'force-dynamic'

import { Settings } from 'lucide-react'
import { auth } from '@/auth'
import { getSetting } from '@/lib/settings'
import { InvoiceUrlForm } from '@/components/instellingen/InvoiceUrlForm'
import { WachtwoordForm } from '@/components/instellingen/WachtwoordForm'

export default async function InstellingenPage() {
  const session = await auth()
  const invoiceUrl = await getSetting('invoiceUrl', 'https://secure20.e-boekhouden.nl/bh/inloggen.asp')

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
      </div>
    </div>
  )
}
