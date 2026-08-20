import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'

type AuthModalProps = {
  open: boolean
  onClose: () => void
}

type Mode = 'signin' | 'signup'

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { configured, signIn, signUp } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!open) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password)
        onClose()
      } else {
        const { needsEmailConfirm } = await signUp(email.trim(), password)
        if (needsEmailConfirm) {
          setInfo('Check your email to confirm your account, then sign in.')
          setMode('signin')
        } else {
          onClose()
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-overlay" role="presentation" onClick={onClose}>
      <div
        className="auth-modal"
        role="dialog"
        aria-labelledby="auth-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="auth-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2 id="auth-title">{mode === 'signin' ? 'Sign in' : 'Create account'}</h2>
        <p className="muted auth-subtitle">
          Sync habits, journal, and pet progress across your devices.
        </p>

        {!configured ? (
          <div className="auth-setup-note">
            <p>
              Sign-in isn’t configured for this deploy yet. Locally, run{' '}
              <code>npm run dev</code> (API + Vite) with <code>MONGODB_URI</code> and{' '}
              <code>JWT_SECRET</code> in <code>.env.local</code>. For production, host the
              API and set <code>VITE_API_URL</code> to that origin.
            </p>
          </div>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {error && <p className="auth-error">{error}</p>}
            {info && <p className="auth-info">{info}</p>}
            <button type="submit" className="auth-submit" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
          </form>
        )}

        {configured && (
          <button
            type="button"
            className="auth-switch"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin')
              setError(null)
              setInfo(null)
            }}
          >
            {mode === 'signin'
              ? 'Need an account? Sign up'
              : 'Already have an account? Sign in'}
          </button>
        )}
      </div>
    </div>
  )
}
