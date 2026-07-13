import type { ReactNode } from 'react'

type TopBarProps = {
  title: string
  onBack: () => void
  children?: ReactNode
}

export function TopBar({ title, onBack, children }: TopBarProps) {
  return (
    <div className="top-bar">
      <button type="button" className="back-btn" onClick={onBack}>
        ← Home
      </button>
      <h1>{title}</h1>
      {children}
    </div>
  )
}
