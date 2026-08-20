import { useCallback, useEffect, useState } from 'react'
import { ColorPickerBar } from '../components/ColorPickerBar'
import {
  InkCanvas,
  InkTools,
  type EraseFieldHit,
  type InkTool,
} from '../components/InkCanvas'
import { JournalLock } from '../components/JournalLock'
import { JournalPromptTools } from '../components/JournalPromptTools'
import { ModeToggle } from '../components/ModeToggle'
import { TopBar } from '../components/TopBar'
import type { AppDataApi } from '../hooks/useAppData'
import { useStrokeUndo } from '../hooks/useStrokeUndo'
import type { InkStroke } from '../types'

type JournalPageProps = {
  api: AppDataApi
  onBack: () => void
}

type LockDialog = 'set' | 'change' | 'remove' | null

export function JournalPageView({ api, onBack }: JournalPageProps) {
  const {
    data,
    setInputMode,
    updateJournalPage,
    setJournalStrokes,
    addJournalPage,
    setActiveJournalPageId,
    setJournalPinHash,
    setColor,
  } = api

  const page =
    data.journalPages.find((p) => p.id === data.activeJournalPageId) ??
    data.journalPages[0]

  const { colors } = data
  const writeMode = data.inputMode === 'write'
  const [inkTool, setInkTool] = useState<InkTool>('pen')
  const [unlocked, setUnlocked] = useState(() => !data.journalPinHash)
  const [lockDialog, setLockDialog] = useState<LockDialog>(null)

  const persistStrokes = (strokes: InkStroke[]) => {
    if (!page) return
    setJournalStrokes(page.id, strokes)
  }

  const { commit, undo, canUndo } = useStrokeUndo(
    page?.id ?? '',
    page?.strokes ?? [],
    persistStrokes,
  )

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--paper', colors.paper)
    root.style.setProperty('--ink', colors.text)
    root.style.setProperty('--accent-purple', colors.gratitudeTitle)
  }, [colors])

  useEffect(() => {
    if (!writeMode) setInkTool('pen')
  }, [writeMode])

  useEffect(() => {
    if (!data.journalPinHash) setUnlocked(true)
  }, [data.journalPinHash])

  const eraseTypedFields = useCallback(
    (fields: EraseFieldHit[]) => {
      if (!page) return
      if (fields.some((f) => f.field === 'journal-text') && page.text) {
        updateJournalPage(page.id, { text: '' })
      }
    },
    [page, updateJournalPage],
  )

  const saveHash = (hash: string | null) => {
    setJournalPinHash(hash)
  }

  if (!page) return null

  const locked = Boolean(data.journalPinHash) && !unlocked

  return (
    <div>
      <TopBar title="Journal" onBack={onBack}>
        {!locked && (
          <div className="journal-lock-actions">
            {data.journalPinHash ? (
              <>
                <button
                  type="button"
                  className="tool-btn"
                  onClick={() => setUnlocked(false)}
                >
                  Lock
                </button>
                <button
                  type="button"
                  className="tool-btn"
                  onClick={() => setLockDialog('change')}
                >
                  Change code
                </button>
                <button
                  type="button"
                  className="tool-btn"
                  onClick={() => setLockDialog('remove')}
                >
                  Remove lock
                </button>
              </>
            ) : (
              <button
                type="button"
                className="tool-btn"
                onClick={() => setLockDialog('set')}
              >
                Set lock code
              </button>
            )}
          </div>
        )}
      </TopBar>

      {locked ? (
        <JournalLock
          pinHash={data.journalPinHash}
          onSaveHash={saveHash}
          onUnlocked={() => setUnlocked(true)}
        />
      ) : (
        <>
          <div className="toolbar-row">
            <ModeToggle mode={data.inputMode} onChange={setInputMode} />
            {writeMode && (
              <InkTools
                tool={inkTool}
                onToolChange={setInkTool}
                onUndo={undo}
                onClear={() => commit([])}
                canUndo={canUndo}
                canClear={page.strokes.length > 0}
              />
            )}
          </div>
          <div className="toolbar-row">
            <ColorPickerBar colors={colors} onChange={setColor} compact />
          </div>
          <JournalPromptTools
            pageTitle={page.title}
            existingText={page.text}
            onInsert={(prompt) => {
              const next = page.text.trim()
                ? `${prompt}\n\n${page.text}`
                : `${prompt}\n\n`
              updateJournalPage(page.id, { text: next })
              if (writeMode) setInputMode('type')
            }}
          />
          <div className="journal-layout">
            <div className="journal-pages">
              {data.journalPages.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`journal-page-chip${p.id === page.id ? ' active' : ''}`}
                  onClick={() => setActiveJournalPageId(p.id)}
                >
                  {p.title}
                </button>
              ))}
              <button type="button" className="journal-page-chip" onClick={addJournalPage}>
                + Page
              </button>
            </div>
            <div
              className="journal-surface journal-lines"
              style={{ backgroundColor: colors.paper, color: colors.text }}
            >
              <textarea
                className={`journal-textarea${writeMode ? ' hidden-mode' : ''}`}
                value={page.text}
                onChange={(e) => updateJournalPage(page.id, { text: e.target.value })}
                placeholder="Start typing…"
                aria-label="Journal text"
                readOnly={writeMode}
                style={{ color: colors.text }}
                data-erase-field="journal-text"
              />
              <InkCanvas
                strokes={page.strokes}
                onChange={commit}
                onEraseFields={eraseTypedFields}
                enabled={writeMode}
                tool={inkTool}
                color={colors.ink}
              />
            </div>
          </div>
        </>
      )}

      {lockDialog && (
        <div
          className="auth-overlay"
          role="presentation"
          onClick={() => setLockDialog(null)}
        >
          <div
            className="auth-modal journal-lock-modal"
            role="dialog"
            aria-labelledby="journal-lock-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="auth-close"
              onClick={() => setLockDialog(null)}
              aria-label="Close"
            >
              ×
            </button>
            <JournalLock
              pinHash={data.journalPinHash}
              initialStep={
                lockDialog === 'set'
                  ? 'set'
                  : lockDialog === 'change'
                    ? 'change-current'
                    : 'remove'
              }
              onSaveHash={saveHash}
              onUnlocked={() => {
                setUnlocked(true)
                setLockDialog(null)
              }}
              onCancel={() => setLockDialog(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
