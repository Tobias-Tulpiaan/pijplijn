const attempts = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000
): { allowed: boolean; remainingMs?: number } {
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }
  if (entry.count >= maxAttempts) {
    return { allowed: false, remainingMs: entry.resetAt - now }
  }
  entry.count++
  return { allowed: true }
}

export function resetRateLimit(key: string) {
  attempts.delete(key)
}
