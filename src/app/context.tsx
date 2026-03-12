import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { BrowserSavedPageRepository, type SavedPage } from '../features/saved-pages/repository'
import { blankCreateDraft, blankEditorState } from './constants'
import type { CreatePageDraft, EditorState, GeneratedMarkdownPayload, ToastState } from './types'
import { createInitialMarkdown, readFileAsDataUrl } from './utils'

type AppStateValue = {
  createDraft: CreatePageDraft
  deleteTarget: SavedPage | null
  editorState: EditorState
  imagePreviewUrl: string | null
  imageSourceName: string | null
  isCreateDialogOpen: boolean
  isCreating: boolean
  isDeleting: boolean
  isGeneratingFromImage: boolean
  isLoading: boolean
  isSaving: boolean
  pages: SavedPage[]
  toast: ToastState | null
  clearReferenceImage: () => void
  closeCreateDialog: () => void
  confirmDelete: () => Promise<void>
  createPage: () => Promise<SavedPage | null>
  getPage: (pageId: string) => SavedPage | null
  openCreateDialog: () => void
  refreshPages: () => Promise<void>
  savePage: (pageId: string, options?: { silent?: boolean }) => Promise<void>
  setCreateDraft: (draft: CreatePageDraft) => void
  setDeleteTarget: (page: SavedPage | null) => void
  setEditorState: (state: EditorState) => void
  setToast: (toast: ToastState | null) => void
  showToast: (message: string, tone?: ToastState['tone']) => void
  startGeneratingFromImage: (pageId: string, file: File) => Promise<void>
}

const AppStateContext = createContext<AppStateValue | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [repository] = useState(() => new BrowserSavedPageRepository(window.localStorage))
  const [pages, setPages] = useState<SavedPage[]>([])
  const [editorState, setEditorState] = useState<EditorState>(blankEditorState)
  const [createDraft, setCreateDraft] = useState<CreatePageDraft>(blankCreateDraft)
  const [deleteTarget, setDeleteTarget] = useState<SavedPage | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isGeneratingFromImage, setIsGeneratingFromImage] = useState(false)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [imageSourceName, setImageSourceName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  async function refreshPages() {
    setPages(await repository.list())
  }

  function getPage(pageId: string) {
    return pages.find(page => page.id === pageId) ?? null
  }

  function showToast(message: string, tone: ToastState['tone'] = 'info') {
    setToast({
      id: Date.now(),
      message,
      tone,
    })
  }

  function openCreateDialog() {
    setIsCreateDialogOpen(true)
  }

  function closeCreateDialog() {
    setIsCreateDialogOpen(false)
    setCreateDraft(blankCreateDraft)
  }

  function clearReferenceImage() {
    setImagePreviewUrl(null)
    setImageSourceName(null)
  }

  useEffect(() => {
    async function loadPages() {
      try {
        await refreshPages()
      }
      finally {
        setIsLoading(false)
      }
    }

    void loadPages()
  }, [])

  useEffect(() => {
    if (!toast)
      return

    const timeoutId = window.setTimeout(() => {
      setToast(current => current?.id === toast.id ? null : current)
    }, 3200)

    return () => window.clearTimeout(timeoutId)
  }, [toast])

  async function savePage(pageId: string, options?: { silent?: boolean }) {
    const currentPage = getPage(pageId)
    if (!currentPage)
      return

    const nextTitle = editorState.title.trim() || currentPage.title
    const nextMarkdown = editorState.markdown
    if (nextTitle === currentPage.title && nextMarkdown === currentPage.markdown)
      return

    setIsSaving(true)

    try {
      await repository.update(currentPage.id, {
        title: nextTitle,
        markdown: nextMarkdown,
      })
      await refreshPages()
      if (!options?.silent)
        showToast('Successed', 'success')
    }
    catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save changes.', 'error')
    }
    finally {
      setIsSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget)
      return

    setIsDeleting(true)

    try {
      await repository.delete(deleteTarget.id)
      await refreshPages()
      showToast('Successed', 'success')
    }
    catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to delete page.', 'error')
    }
    finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  async function createPage() {
    if (!createDraft.title.trim())
      return null

    setIsCreating(true)

    try {
      const createdPage = await repository.create({
        title: createDraft.title.trim(),
        markdown: createInitialMarkdown(),
      })

      await refreshPages()
      closeCreateDialog()
      showToast('Successed', 'success')
      return createdPage
    }
    catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create page.', 'error')
      return null
    }
    finally {
      setIsCreating(false)
    }
  }

  async function startGeneratingFromImage(pageId: string, file: File) {
    const currentPage = getPage(pageId)
    if (!currentPage)
      return

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image is too large. Please upload an image smaller than 5MB.', 'error')
      return
    }

    setIsGeneratingFromImage(true)

    try {
      const imageDataUrl = await readFileAsDataUrl(file)
      setImagePreviewUrl(imageDataUrl)
      setImageSourceName(file.name)

      const response = await fetch('/api/generate-markdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageDataUrl,
          mimeType: file.type || 'image/png',
        }),
      })

      const result = await response.json() as GeneratedMarkdownPayload | { error?: string }
      const hasGeneratedContent = 'markdown' in result && 'title' in result

      if (hasGeneratedContent) {
        setEditorState({
          title: result.title,
          markdown: result.markdown,
        })
      }

      if (!response.ok && !hasGeneratedContent)
        throw new Error('error' in result && result.error ? result.error : 'AI generation failed.')

      if (!hasGeneratedContent)
        throw new Error('error' in result && result.error ? result.error : 'AI generation failed.')

      if (result.error) {
        showToast(`Generation returned content with issues: ${result.error}`, 'info')
        return
      }

      showToast('Successed', 'success')
    }
    catch (error) {
      showToast(error instanceof Error ? error.message : 'AI generation failed.', 'error')
    }
    finally {
      setIsGeneratingFromImage(false)
    }
  }

  return (
    <AppStateContext.Provider
      value={{
        createDraft,
        deleteTarget,
        editorState,
        imagePreviewUrl,
        imageSourceName,
        isCreateDialogOpen,
        isCreating,
        isDeleting,
        isGeneratingFromImage,
        isLoading,
        isSaving,
        pages,
        toast,
        clearReferenceImage,
        closeCreateDialog,
        confirmDelete,
        createPage,
        getPage,
        openCreateDialog,
        refreshPages,
        savePage,
        setCreateDraft,
        setDeleteTarget,
        setEditorState,
        setToast,
        showToast,
        startGeneratingFromImage,
      }}
    >
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState() {
  const value = useContext(AppStateContext)
  if (!value)
    throw new Error('useAppState must be used within AppStateProvider')

  return value
}
