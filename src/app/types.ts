import type { SavedPage } from '../features/saved-pages/repository'

export type EditorState = {
  markdown: string
  title: string
}

export type GeneratedMarkdownPayload = {
  error?: string
  markdown: string
  rawText?: string
  title: string
}

export type CreatePageDraft = {
  summary: string
  title: string
}

export type PageMetaDraft = {
  description: string
  title: string
}

export type ToastState = {
  id: number
  message: string
  tone: 'error' | 'info' | 'success'
}

export type CreatePageDialogProps = {
  draft: CreatePageDraft
  isOpen: boolean
  isSubmitting: boolean
  onChange: (draft: CreatePageDraft) => void
  onClose: () => void
  onSubmit: () => void
}

export type DeletePageDialogProps = {
  isDeleting: boolean
  page: SavedPage | null
  onClose: () => void
  onConfirm: () => void
}
