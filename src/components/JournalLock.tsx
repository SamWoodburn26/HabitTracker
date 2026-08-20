import { useEffect, useRef, useState } from 'react'
import { hashJournalPin, isValidPin, pinMatches } from '../lib/journalPin'

type LockStep =
  | 'unlock'
  | 'set'
  | 'confirm-set'
  | 'change-current'
  | 'change-new'
  | 'change-confirm'
  | 'remove'

type JournalLockProps = {
  pinHash: string | null
  onSaveHash: (hash: string | null) => void
  onUnlocked: () => void
  onCancel?: () => void
  initialStep?: LockStep
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const

function stepCopy(step: LockStep, hasPin: boolean): { title: string; subtitle: string } {
  switch (step) {
    case 'unlock':
      return {
        title: 'Journal locked',
        subtitle: 'Enter your 4-digit code to open the journal.',
      }
    case 'set':
      return {
        title: hasPin ? 'New code' : 'Lock journal',
        subtitle: 'Choose a 4-digit code. You’ll need it each time you open the journal.',
      }
    case 'confirm-set':
    case 'change-confirm':
      return {
        title: 'Confirm code',
        subtitle: 'Enter the same 4-digit code again.',
      }
    case 'change-current':
    case 'remove':
      return {
        title: step === 'remove' ? 'Remove lock' : 'Change code',
        subtitle: 'Enter your current 4-digit code.',
      }
    case 'change-new':
      return {
        title: 'New code',
        subtitle: 'Choose a new 4-digit code.',
      }
  }
}

export function JournalLock({
  pinHash,
  onSaveHash,
  onUnlocked,
  onCancel,
  initialStep,
}: JournalLockProps) {
  const [step, setStep] = useState<LockStep>(
    initialStep ?? (pinHash ? 'unlock' : 'set'),
  )
  const [digits, setDigits] = useState('')
  const [pendingPin, setPendingPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [shake, setShake] = useState(false)
  const hiddenInputRef = useRef<HTMLInputElement>(null)
  const busyRef = useRef(false)

  useEffect(() => {
    hiddenInputRef.current?.focus()
  }, [step])

  function fail(message: string) {
    setError(message)
    setDigits('')
    setShake(true)
    window.setTimeout(() => setShake(false), 420)
  }

  async function accept(pin: string) {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    setError(null)
    try {
      if (step === 'unlock') {
        if (!pinHash || !(await pinMatches(pin, pinHash))) {
          fail('That code doesn’t match.')
          return
        }
        onUnlocked()
        return
      }

      if (step === 'set' || step === 'change-new') {
        setPendingPin(pin)
        setDigits('')
        setStep(step === 'set' ? 'confirm-set' : 'change-confirm')
        return
      }

      if (step === 'confirm-set' || step === 'change-confirm') {
        if (pin !== pendingPin) {
          fail('Codes didn’t match. Try again.')
          setPendingPin('')
          setStep(step === 'confirm-set' ? 'set' : 'change-new')
          return
        }
        onSaveHash(await hashJournalPin(pin))
        onUnlocked()
        return
      }

      if (step === 'change-current') {
        if (!pinHash || !(await pinMatches(pin, pinHash))) {
          fail('That code doesn’t match.')
          return
        }
        setDigits('')
        setStep('change-new')
        return
      }

      if (step === 'remove') {
        if (!pinHash || !(await pinMatches(pin, pinHash))) {
          fail('That code doesn’t match.')
          return
        }
        onSaveHash(null)
        onUnlocked()
      }
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  function pushDigit(d: string) {
    if (busy) return
    const next = (digits + d).slice(0, 4)
    setDigits(next)
    setError(null)
    if (next.length === 4 && isValidPin(next)) {
      void accept(next)
    }
  }

  function popDigit() {
    if (busy) return
    setDigits((prev) => prev.slice(0, -1))
    setError(null)
  }

  const copy = stepCopy(step, Boolean(pinHash))

  return (
    <div className="journal-lock">
      <h2 id="journal-lock-title" className="journal-lock-title">
        {copy.title}
      </h2>
      <p className="journal-lock-subtitle">{copy.subtitle}</p>

      <input
        ref={hiddenInputRef}
        className="journal-lock-hidden"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        autoCorrect="off"
        autoCapitalize="off"
        aria-label="Journal lock code"
        value={digits}
        onChange={(e) => {
          const next = e.target.value.replace(/\D/g, '').slice(0, 4)
          setDigits(next)
          setError(null)
          if (next.length === 4) void accept(next)
        }}
      />

      <div
        className={`journal-lock-dots${shake ? ' shake' : ''}`}
        aria-hidden
      >
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`journal-lock-dot${i < digits.length ? ' filled' : ''}`}
          />
        ))}
      </div>

      {error && (
        <p className="journal-lock-error" role="alert">
          {error}
        </p>
      )}

      <div className="journal-lock-pad">
        {KEYS.map((key, i) => {
          if (key === '') {
            return <span key={`empty-${i}`} className="journal-lock-key spacer" />
          }
          if (key === 'del') {
            return (
              <button
                key="del"
                type="button"
                className="journal-lock-key del"
                onClick={popDigit}
                disabled={busy}
                aria-label="Delete"
              >
                ⌫
              </button>
            )
          }
          return (
            <button
              key={key}
              type="button"
              className="journal-lock-key"
              onClick={() => pushDigit(key)}
              disabled={busy}
            >
              {key}
            </button>
          )
        })}
      </div>

      {onCancel && step !== 'unlock' && (
        <button type="button" className="journal-lock-cancel" onClick={onCancel}>
          Cancel
        </button>
      )}
    </div>
  )
}
