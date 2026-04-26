const ipRequests = new Map<string, { count: number; resetAt: number }>()

const WINDOW_MS = 60 * 1000
const MAX_REQUESTS = 10

export function rateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const record = ipRequests.get(ip)

  if (!record || record.resetAt <= now) {
    ipRequests.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: MAX_REQUESTS - 1 }
  }

  record.count += 1

  if (record.count > MAX_REQUESTS) {
    return { allowed: false, remaining: 0 }
  }

  return { allowed: true, remaining: MAX_REQUESTS - record.count }
}