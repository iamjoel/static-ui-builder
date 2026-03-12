import type { PageMetaDraft } from './types'

const timestampFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function describePreview(markdown: string) {
  return markdown
    .replace(/:{2,}[^\n]*/g, ' ')
    .replace(/[#>*`\-\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function formatTimestamp(value: string) {
  return timestampFormatter.format(new Date(value))
}

export function createInitialMarkdown() {
  return ''
}

function isMarkdownBlockStart(line: string) {
  const trimmed = line.trim()
  return /^(#{1,6}\s|[-*+]\s|\d+\.\s|```|~~~|:::+|>\s?)/.test(trimmed)
}

export function extractPageMeta(markdown: string, fallbackTitle: string): PageMetaDraft {
  const lines = markdown.split('\n')
  let cursor = 0

  while (cursor < lines.length && !lines[cursor].trim())
    cursor += 1

  let title = fallbackTitle.trim() || 'Untitled page'
  let description = ''

  if (cursor < lines.length) {
    const headingMatch = lines[cursor].match(/^#\s+(.+)$/)
    if (headingMatch) {
      title = headingMatch[1].trim() || title
      cursor += 1

      while (cursor < lines.length && !lines[cursor].trim())
        cursor += 1

      const descriptionStart = cursor
      while (cursor < lines.length && lines[cursor].trim() && !isMarkdownBlockStart(lines[cursor]))
        cursor += 1

      if (cursor > descriptionStart)
        description = lines.slice(descriptionStart, cursor).join('\n').trim()
    }
  }

  return { title, description }
}

export function applyPageMeta(markdown: string, draft: PageMetaDraft) {
  const title = draft.title.trim() || 'Untitled page'
  const description = draft.description.trim()
  const lines = markdown.split('\n')
  let cursor = 0

  while (cursor < lines.length && !lines[cursor].trim())
    cursor += 1

  let body = markdown.trim()

  if (cursor < lines.length && /^#\s+(.+)$/.test(lines[cursor])) {
    cursor += 1

    while (cursor < lines.length && !lines[cursor].trim())
      cursor += 1

    while (cursor < lines.length && lines[cursor].trim() && !isMarkdownBlockStart(lines[cursor]))
      cursor += 1

    body = lines.slice(cursor).join('\n').trim()
  }

  return [
    `# ${title}`,
    description,
    body,
  ].filter(Boolean).join('\n\n')
}

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string')
        resolve(reader.result)
      else
        reject(new Error('Failed to read image file'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image file'))
    reader.readAsDataURL(file)
  })
}
