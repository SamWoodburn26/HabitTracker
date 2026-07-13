const configuredUrl = import.meta.env.VITE_OLLAMA_URL as string | undefined
const configuredModel = import.meta.env.VITE_OLLAMA_MODEL as string | undefined

/** Proxied by Vite in dev (see vite.config.ts). Override with VITE_OLLAMA_URL. */
export const ollamaBaseUrl = (configuredUrl?.replace(/\/$/, '') || '/ollama').replace(
  /\/$/,
  '',
)

export const ollamaModel = configuredModel?.trim() || 'gemma3:4b'

export const isOllamaConfigured = Boolean(ollamaBaseUrl && ollamaModel)

export type OllamaChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type OllamaGenerateOptions = {
  model?: string
  messages: OllamaChatMessage[]
  signal?: AbortSignal
}

export async function generateWithOllama({
  model = ollamaModel,
  messages,
  signal,
}: OllamaGenerateOptions): Promise<string> {
  const response = await fetch(`${ollamaBaseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: {
        temperature: 0.9,
      },
    }),
    signal,
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(
      detail.trim() ||
        `Ollama request failed (${response.status}). Is Ollama running and is model "${model}" pulled?`,
    )
  }

  const data = (await response.json()) as {
    message?: { content?: string }
    error?: string
  }

  if (data.error) {
    throw new Error(data.error)
  }

  const content = data.message?.content?.trim()
  if (!content) {
    throw new Error('Ollama returned an empty response.')
  }

  return content.replace(/^["“]|["”]$/g, '').trim()
}
