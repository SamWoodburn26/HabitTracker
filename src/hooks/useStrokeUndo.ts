import { useCallback, useEffect, useRef, useState } from 'react'
import type { InkStroke } from '../types'

/** Undo stack for ink commits (draw, erase, clear). Resets when `pageKey` changes. */
export function useStrokeUndo(
  pageKey: string,
  strokes: InkStroke[],
  setStrokes: (strokes: InkStroke[]) => void,
) {
  const historyRef = useRef<InkStroke[][]>([])
  const strokesRef = useRef(strokes)
  const [canUndo, setCanUndo] = useState(false)

  strokesRef.current = strokes

  useEffect(() => {
    historyRef.current = []
    setCanUndo(false)
  }, [pageKey])

  const commit = useCallback(
    (next: InkStroke[]) => {
      historyRef.current.push(strokesRef.current)
      if (historyRef.current.length > 60) historyRef.current.shift()
      setCanUndo(true)
      setStrokes(next)
    },
    [setStrokes],
  )

  const undo = useCallback(() => {
    const prev = historyRef.current.pop()
    if (!prev) return
    setCanUndo(historyRef.current.length > 0)
    setStrokes(prev)
  }, [setStrokes])

  return { commit, undo, canUndo }
}
