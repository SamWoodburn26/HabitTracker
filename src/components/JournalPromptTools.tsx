import { useEffect, useRef, useState } from 'react'
import { generateWithOllama, ollamaModel } from '../lib/ollama'
import {
  fillJournalPromptTemplate,
  journalPromptTemplates,
  type JournalPromptKind,
} from '../lib/prompts/journalPrompts'

type JournalPromptToolsProps = {
  pageTitle: string
  existingText: string
  onInsert: (prompt: string) => void
}

export function JournalPromptTools({
  pageTitle,
  existingText,
  onInsert,
}: JournalPromptToolsProps) {
  const [busy, setBusy] = useState<JournalPromptKind | null>(null)
  const [suggestion, setSuggestion] = useState('')
  const [error, setError] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  async function generate(kind: JournalPromptKind) {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setBusy(kind)
    setError('')
    setSuggestion('')

    const template = journalPromptTemplates[kind]

    try {
      const prompt = await generateWithOllama({
        signal: controller.signal,
        messages: [
          { role: 'system', content: template.system },
          {
            role: 'user',
            content: fillJournalPromptTemplate(template.user, {
              pageTitle,
              existingText,
            }),
          },
        ],
      })
      setSuggestion(prompt)
    } catch (err) {
      if (controller.signal.aborted) return
      const message =
        err instanceof Error ? err.message : 'Could not generate a prompt.'
      setError(
        message.includes('Failed to fetch')
          ? `Cannot reach Ollama. Make sure it is running (model: ${ollamaModel}).`
          : message,
      )
    } finally {
      if (abortRef.current === controller) {
        setBusy(null)
      }
    }
  }

  return (
    <div className="journal-ai">
      <div className="toolbar-row journal-ai-actions">
        <button
          type="button"
          className="tool-btn"
          onClick={() => generate('short')}
          disabled={busy !== null}
        >
          {busy === 'short'
            ? 'Generating…'
            : 'Generate short writing prompt for a quick journal'}
        </button>
        <button
          type="button"
          className="tool-btn"
          onClick={() => generate('long')}
          disabled={busy !== null}
        >
          {busy === 'long'
            ? 'Generating…'
            : 'Generate long writing prompt for a more complex question'}
        </button>
      </div>

      {error ? (
        <p className="journal-ai-error" role="alert">
          {error}
        </p>
      ) : null}

      {suggestion ? (
        <div className="journal-ai-suggestion">
          <p className="journal-ai-label">Writing prompt</p>
          <p className="journal-ai-text">{suggestion}</p>
          <div className="toolbar-row">
            <button
              type="button"
              className="tool-btn"
              onClick={() => onInsert(suggestion)}
            >
              Insert into journal
            </button>
            <button
              type="button"
              className="tool-btn"
              onClick={() => setSuggestion('')}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
