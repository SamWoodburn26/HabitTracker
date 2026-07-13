import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { HomeHub } from './components/HomeHub'
import { useAppData } from './hooks/useAppData'
import { CarePetPage } from './pages/CarePetPage'
import { HabitTrackerPage } from './pages/HabitTrackerPage'
import { JournalPageView } from './pages/JournalPage'
import type { InputMode } from './types'

type View = 'home' | 'pet' | 'habits' | 'journal'

function detectDefaultMode(): InputMode {
  if (typeof window === 'undefined') return 'type'
  const fine = window.matchMedia('(pointer: fine)').matches
  if (fine && window.innerWidth >= 768) return 'write'
  return 'type'
}

function AppShell() {
  const { user } = useAuth()
  const api = useAppData({ userId: user?.id ?? null })
  const [view, setView] = useState<View>('home')

  useEffect(() => {
    const stored = localStorage.getItem('habits-app-mode-set')
    if (!stored) {
      api.setInputMode(detectDefaultMode())
      localStorage.setItem('habits-app-mode-set', '1')
    }
  }, [api.setInputMode])

  return (
    <div className="app-shell">
      {view === 'home' && (
        <HomeHub onSelect={setView} syncStatus={api.syncStatus} />
      )}
      {view === 'pet' && <CarePetPage api={api} onBack={() => setView('home')} />}
      {view === 'habits' && (
        <HabitTrackerPage api={api} onBack={() => setView('home')} />
      )}
      {view === 'journal' && (
        <JournalPageView api={api} onBack={() => setView('home')} />
      )}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
