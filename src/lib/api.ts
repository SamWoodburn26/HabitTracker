const TOKEN_KEY = 'habits-app-auth-token'

const apiBase = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export const isApiConfigured = Boolean(
  import.meta.env.DEV ||
    (apiBase && !apiBase.includes('YOUR_') && apiBase.length > 0),
)

export type AuthUser = {
  id: string
  email: string
}

type ApiErrorBody = { error?: string }

function authHeaders(token?: string | null): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const t = token ?? getToken()
  if (t) headers.Authorization = `Bearer ${t}`
  return headers
}

async function parseJson<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => ({}))) as T & ApiErrorBody
  if (!res.ok) {
    throw new Error(body.error || `Request failed (${res.status})`)
  }
  return body
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${apiBase}${path}`, init)
  } catch {
    throw new Error(
      'Could not reach the sign-in server. Stop Vite, then run npm run dev so both the API and app start.',
    )
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // ignore quota / private mode
  }
}

export async function apiSignIn(
  email: string,
  password: string,
): Promise<{ user: AuthUser; token: string }> {
  const res = await apiFetch('/api/auth/signin', {
    method: 'POST',
    headers: authHeaders(null),
    body: JSON.stringify({ email, password }),
  })
  return parseJson(res)
}

export async function apiSignUp(
  email: string,
  password: string,
): Promise<{ user: AuthUser; token: string }> {
  const res = await apiFetch('/api/auth/signup', {
    method: 'POST',
    headers: authHeaders(null),
    body: JSON.stringify({ email, password }),
  })
  return parseJson(res)
}

export async function apiMe(token?: string | null): Promise<AuthUser> {
  const res = await apiFetch('/api/auth/me', {
    headers: authHeaders(token),
  })
  const body = await parseJson<{ user: AuthUser }>(res)
  return body.user
}

export async function apiFetchAppData(): Promise<unknown | null> {
  const res = await apiFetch('/api/data', {
    headers: authHeaders(),
  })
  const body = await parseJson<{ data: unknown | null }>(res)
  return body.data
}

export async function apiSaveAppData(data: unknown): Promise<void> {
  const res = await apiFetch('/api/data', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ data }),
  })
  await parseJson(res)
}
