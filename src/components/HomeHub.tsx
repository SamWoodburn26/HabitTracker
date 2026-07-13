import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { AuthModal } from './AuthModal'

type HomeHubProps = {
  onSelect: (view: 'pet' | 'habits' | 'journal') => void
  syncStatus?: 'idle' | 'syncing' | 'saved' | 'error'
}

function EggIcon() {
  return (
    <svg className="icon" viewBox="0 0 48 48" width="40" height="40" aria-hidden>
      <ellipse cx="24" cy="28" rx="12" ry="15" fill="#F5EDE0" />
      <ellipse cx="20" cy="24" rx="4" ry="5" fill="#D4B8E8" opacity="0.85" />
      <ellipse cx="28" cy="30" rx="3.5" ry="4" fill="#D4B8E8" opacity="0.75" />
      <ellipse cx="24" cy="22" rx="3" ry="3.5" fill="#C9B0E8" opacity="0.5" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="icon" viewBox="0 0 48 48" width="40" height="40" aria-hidden>
      <rect x="8" y="8" width="32" height="32" rx="8" fill="#6BB08C" opacity="0.25" />
      <path
        d="M14 24l7 7 13-14"
        fill="none"
        stroke="#4a8f6a"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function JournalIcon() {
  return (
    <svg className="icon" viewBox="0 0 48 48" width="40" height="40" aria-hidden>
      <rect x="10" y="6" width="28" height="36" rx="4" fill="#9B7BC4" opacity="0.25" />
      <path d="M18 16h12M18 24h12M18 32h8" stroke="#7b5ea7" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function HomeHub({ onSelect, syncStatus = 'idle' }: HomeHubProps) {
  const { user, loading, signOut, configured } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)

  return (
    <div className="home-hub">
      <div className="home-auth-bar">
        {loading ? (
          <span className="muted">Checking account…</span>
        ) : user ? (
          <div className="home-auth-signed-in">
            <span className="home-auth-email" title={user.email ?? undefined}>
              {user.email}
            </span>
            {syncStatus === 'syncing' && (
              <span className="sync-pill syncing">Syncing…</span>
            )}
            {syncStatus === 'saved' && (
              <span className="sync-pill saved">Synced</span>
            )}
            {syncStatus === 'error' && (
              <span className="sync-pill error">Sync issue</span>
            )}
            <button type="button" className="tool-btn" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        ) : (
          <button type="button" className="tool-btn auth-open-btn" onClick={() => setAuthOpen(true)}>
            {configured ? 'Sign in' : 'Sign in (setup)'}
          </button>
        )}
      </div>

      <h1 className="brand">Habits & Care</h1>
      <p className="tagline">Grow your pet. Track your days. Write it down.</p>
      <div className="hub-grid">
        <button type="button" className="hub-card pet" onClick={() => onSelect('pet')}>
          <EggIcon />
          <span className="label">My Care Pet</span>
        </button>
        <button
          type="button"
          className="hub-card habits"
          onClick={() => onSelect('habits')}
        >
          <CheckIcon />
          <span className="label">Habit Tracker</span>
        </button>
        <button
          type="button"
          className="hub-card journal"
          onClick={() => onSelect('journal')}
        >
          <JournalIcon />
          <span className="label">Journal</span>
        </button>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  )
}
