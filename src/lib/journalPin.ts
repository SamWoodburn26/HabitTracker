const PIN_PREFIX = 'habits-journal-v1:'

export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin)
}

export async function hashJournalPin(pin: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${PIN_PREFIX}${pin}`),
  )
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function pinMatches(pin: string, hash: string): Promise<boolean> {
  if (!isValidPin(pin) || !hash) return false
  const next = await hashJournalPin(pin)
  return next === hash
}
