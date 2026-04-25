import { prisma } from '@/lib/prisma'

const cache = new Map<string, { value: string; expiresAt: number }>()

export async function getSetting(key: string, fallback = ''): Promise<string> {
  const now = Date.now()
  const cached = cache.get(key)
  if (cached && cached.expiresAt > now) return cached.value

  try {
    const row = await prisma.settings.findUnique({ where: { key } })
    const value = row?.value ?? fallback
    cache.set(key, { value, expiresAt: now + 5 * 60 * 1000 })
    return value
  } catch {
    return fallback
  }
}
