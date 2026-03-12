import { getDirectiveGenerationGuide } from '../src/components/markdown-with-directive/components/markdown-with-directive-schema'

const SYSTEM_PROMPT_SECTIONS = [
  'You convert an input image into Markdown content.',
  'Return only a JSON object with keys "title" and "markdown".',
  'The markdown must faithfully describe the uploaded image.',
  'You may use plain Markdown freely.',
  'Do not use any other custom component, raw HTML, JSX, MDX, or fenced code blocks.',
  'Do not invent unsupported attributes.',
  'Keep the markdown concise, structured, and ready to render.',
] as const

export function buildGenerateMarkdownSystemPrompt(previousAttemptError?: string) {
  return [
    ...SYSTEM_PROMPT_SECTIONS,
    getDirectiveGenerationGuide(),
    previousAttemptError
      ? `The previous attempt failed validation. You must fix this specific error: ${previousAttemptError}`
      : '',
  ].join(' ')
}
