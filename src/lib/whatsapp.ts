export function normalizePhone(phone: string): string | null {
  if (!phone) return null
  let clean = phone.replace(/[\s\-\(\)]/g, '')

  if (clean.startsWith('+')) return clean.slice(1)
  if (clean.startsWith('00')) return clean.slice(2)
  if (clean.startsWith('0')) return '31' + clean.slice(1)
  return clean
}

export function buildWhatsappUrl(phone: string, message: string): string | null {
  const normalized = normalizePhone(phone)
  if (!normalized) return null
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}

export function fillTemplate(body: string, variables: Record<string, string>): string {
  let result = body
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
  }
  return result
}

export function extractVariables(body: string): string[] {
  const matches = body.match(/\{([^}]+)\}/g) || []
  return matches.map((m) => m.slice(1, -1))
}
