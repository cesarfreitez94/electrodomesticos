const attempts = new Map<string, { count: number; blockedUntil: number }>()

const MAX_ATTEMPTS = 5
const BLOCK_DURATION_MS = 15 * 60 * 1000

export function recordFailedAttempt(email: string): boolean {
  const now = Date.now()
  const record = attempts.get(email)

  if (!record) {
    attempts.set(email, { count: 1, blockedUntil: 0 })
    return false
  }

  if (record.blockedUntil > now) {
    return true
  }

  record.count += 1

  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS
    return true
  }

  return false
}

export function clearAttempts(email: string): void {
  attempts.delete(email)
}

export function isBlocked(email: string): { blocked: boolean; remainingMinutes: number } {
  const record = attempts.get(email)
  if (!record) return { blocked: false, remainingMinutes: 0 }

  const now = Date.now()
  if (record.blockedUntil <= now) {
    attempts.delete(email)
    return { blocked: false, remainingMinutes: 0 }
  }

  const remaining = Math.ceil((record.blockedUntil - now) / 60000)
  return { blocked: true, remainingMinutes: remaining }
}