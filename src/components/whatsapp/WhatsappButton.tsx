'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { buildWhatsappUrl, fillTemplate } from '@/lib/whatsapp'

interface Template {
  id: string
  name: string
  body: string
  category: string | null
}

interface Props {
  phone: string | null
  recipientName: string
  recipientType: 'candidate' | 'contact'
  recipientId: string
  context?: {
    opdrachtgever?: string
    vacature?: string
    functie?: string
    datum?: string
    tijd?: string
    aantal?: string
  }
}

export function WhatsappButton({ phone, recipientName, recipientType, recipientId, context }: Props) {
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)
  const [customMessage, setCustomMessage] = useState('')

  const filterCategories = recipientType === 'candidate' ? 'kandidaat,algemeen' : 'contact,algemeen'

  const openDialog = async () => {
    setOpen(true)
    setLoading(true)
    try {
      const res = await fetch(`/api/whatsapp-templates?categories=${filterCategories}`)
      const data = await res.json()
      setTemplates(data)
    } finally {
      setLoading(false)
    }
  }

  const resolveVars = (): Record<string, string> => ({
    naam: recipientName.split(' ')[0],
    ...(context?.opdrachtgever ? { opdrachtgever: context.opdrachtgever } : {}),
    ...(context?.vacature ? { vacature: context.vacature } : {}),
    ...(context?.functie ? { functie: context.functie } : {}),
    ...(context?.datum ? { datum: context.datum } : {}),
    ...(context?.tijd ? { tijd: context.tijd } : {}),
    ...(context?.aantal ? { aantal: context.aantal } : {}),
  })

  const logAndOpen = async (body: string, templateId?: string) => {
    const url = buildWhatsappUrl(phone!, body)
    if (!url) return

    await fetch('/api/whatsapp-messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: templateId ?? null,
        recipientType,
        recipientId,
        recipientName,
        recipientPhone: phone,
        body,
      }),
    }).catch(() => {})

    window.open(url, '_blank')
    setOpen(false)
    setCustomMessage('')
  }

  const sendTemplate = (template: Template) => {
    const filled = fillTemplate(template.body, resolveVars())
    logAndOpen(filled, template.id)
  }

  const sendCustom = () => {
    if (!customMessage.trim()) return
    logAndOpen(customMessage.trim())
  }

  if (!phone) return null

  return (
    <>
      <button
        onClick={openDialog}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
        style={{ backgroundColor: 'rgba(37,211,102,0.12)', color: '#075E54' }}
        title="Verstuur via WhatsApp"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        WhatsApp
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>WhatsApp naar {recipientName}</DialogTitle>
          </DialogHeader>

          {loading && (
            <p className="text-sm py-4" style={{ color: '#6B6B6B' }}>Templates laden…</p>
          )}

          {!loading && templates.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-xs font-medium" style={{ color: '#6B6B6B' }}>Kies een template:</p>
              {templates.map((t) => {
                const preview = fillTemplate(t.body, resolveVars())
                return (
                  <button
                    key={t.id}
                    onClick={() => sendTemplate(t)}
                    className="w-full text-left p-3 border rounded-lg hover:border-[#CBAD74] hover:bg-[#CBAD74]/5 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{t.name}</span>
                      {t.category && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#f3f4f6', color: '#6B6B6B' }}>
                          {t.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs whitespace-pre-line line-clamp-2" style={{ color: '#6B6B6B' }}>{preview}</p>
                  </button>
                )
              })}
            </div>
          )}

          {!loading && templates.length === 0 && (
            <p className="text-sm py-2" style={{ color: '#6B6B6B' }}>Geen templates beschikbaar. Voeg ze toe via Instellingen.</p>
          )}

          <div className="border-t pt-4">
            <p className="text-xs font-medium mb-2" style={{ color: '#6B6B6B' }}>Of stuur een eigen bericht:</p>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
              placeholder="Type je bericht…"
              className="w-full p-2.5 border rounded-md resize-none text-sm"
              style={{ borderColor: '#e5e7eb' }}
            />
            <button
              onClick={sendCustom}
              disabled={!customMessage.trim()}
              className="mt-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#25D366' }}
            >
              Open WhatsApp
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
