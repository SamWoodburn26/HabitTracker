import { useEffect } from 'react'
import { ColorPickerBar } from '../components/ColorPickerBar'
import { InkCanvas, InkTools } from '../components/InkCanvas'
import { JournalPromptTools } from '../components/JournalPromptTools'
import { ModeToggle } from '../components/ModeToggle'
import { TopBar } from '../components/TopBar'
import type { AppDataApi } from '../hooks/useAppData'

type JournalPageProps = {
  api: AppDataApi
  onBack: () => void
}

export function JournalPageView({ api, onBack }: JournalPageProps) {
  const {
    data,
    setInputMode,
    updateJournalPage,
    setJournalStrokes,
    addJournalPage,
    setActiveJournalPageId,
    setColor,
  } = api

  const page =
    data.journalPages.find((p) => p.id === data.activeJournalPageId) ??
    data.journalPages[0]

  const { colors } = data
  const writeMode = data.inputMode === 'write'

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--paper', colors.paper)
    root.style.setProperty('--ink', colors.text)
    root.style.setProperty('--accent-purple', colors.gratitudeTitle)
  }, [colors])

  if (!page) return null

  return (
    <div>
      <TopBar title="Journal" onBack={onBack} />
      <div className="toolbar-row">
        <ModeToggle mode={data.inputMode} onChange={setInputMode} />
        {writeMode && (
          <InkTools
            onUndo={() =>
              setJournalStrokes(page.id, page.strokes.slice(0, -1))
            }
            onClear={() => setJournalStrokes(page.id, [])}
            disabled={page.strokes.length === 0}
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
          />
          <InkCanvas
            strokes={page.strokes}
            onChange={(strokes) => setJournalStrokes(page.id, strokes)}
            enabled={writeMode}
            color={colors.ink}
          />
        </div>
      </div>
    </div>
  )
}
