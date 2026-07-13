/**
 * Journal writing-prompt templates for the local Ollama agent.
 *
 * Edit the strings below to change how prompts are generated.
 * Placeholders (optional):
 *   {{existingText}} — current journal page text (or a note if empty)
 *   {{pageTitle}}    — current page title
 */

export type JournalPromptKind = 'short' | 'long'

export type JournalPromptTemplate = {
  /** System message: sets tone and output rules for the model. */
  system: string
  /** User message: the actual request. Supports {{existingText}} and {{pageTitle}}. */
  user: string
}

export const journalPromptTemplates: Record<JournalPromptKind, JournalPromptTemplate> = {
  short: {
    system: `You are a warm, thoughtful journaling companion.
Generate ONE short writing prompt suitable for a quick journal entry (1–3 sentences of reflection).
Rules:
- Reply with only the prompt itself — no intro, no quotes, no bullet points, no options.
- Keep it under 25 words.
- Make it inviting and concrete, not abstract or clinical.
- Do not answer the prompt; only ask it.`,

    user: `Page title: {{pageTitle}}

Current journal text (for light context; do not summarize it):
{{existingText}}

Generate a short writing prompt.`,
  },

  long: {
    system: `You are a warm, thoughtful journaling companion.
Generate ONE deeper writing prompt for a longer, more reflective journal entry.
Rules:
- Reply with only the prompt itself — no intro, no quotes, no bullet points, no options.
- Aim for 2–4 sentences that invite nuance, memory, or self-inquiry.
- Make it specific and emotionally resonant, not generic self-help.
- Do not answer the prompt; only ask it.`,

    user: `Page title: {{pageTitle}}

Current journal text (for light context; do not summarize it):
{{existingText}}

Generate a longer, more complex writing prompt.`,
  },
}

export function fillJournalPromptTemplate(
  template: string,
  vars: { existingText: string; pageTitle: string },
): string {
  const existingText =
    vars.existingText.trim() ||
    '(empty — invent a fresh prompt; do not mention that the page is empty)'

  return template
    .replaceAll('{{pageTitle}}', vars.pageTitle.trim() || 'Untitled')
    .replaceAll('{{existingText}}', existingText)
}
