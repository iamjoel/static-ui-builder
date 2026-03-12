import { useDeferredValue, useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { FilePenLine, ImageUp, Save } from 'lucide-react'
import { previewClassName } from '../app/constants'
import { useAppState } from '../app/context'
import { EditPageInfoDialog, PageHeading } from '../app/ui'
import { extractPageMeta, applyPageMeta } from '../app/utils'
import { MarkdownWithDirective } from '../components/markdown-with-directive'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Textarea } from '../components/ui/textarea'
import { cn } from '../lib/utils'

export function EditorPage({ pageId }: { pageId: string }) {
  const navigate = useNavigate()
  const {
    clearReferenceImage,
    editorState,
    getPage,
    imagePreviewUrl,
    imageSourceName,
    isGeneratingFromImage,
    isLoading,
    isSaving,
    savePage,
    setEditorState,
    startGeneratingFromImage,
  } = useAppState()

  const deferredMarkdown = useDeferredValue(editorState.markdown)
  const [isEditInfoDialogOpen, setIsEditInfoDialogOpen] = useState(false)
  const [isDraggingReference, setIsDraggingReference] = useState(false)
  const [leftPanelView, setLeftPanelView] = useState<'editor' | 'reference'>('reference')
  const currentPage = getPage(pageId)
  const isMissingPage = !currentPage && !isLoading
  const hasUnsavedEditorChanges = currentPage
    && ((editorState.title.trim() || currentPage.title) !== currentPage.title
      || editorState.markdown !== currentPage.markdown)
  const [metaDraft, setMetaDraft] = useState(() =>
    extractPageMeta(editorState.markdown, editorState.title || (currentPage?.title ?? '')),
  )

  useEffect(() => {
    if (!currentPage)
      return

    setEditorState({
      title: currentPage.title,
      markdown: currentPage.markdown,
    })
  }, [currentPage, setEditorState])

  useEffect(() => {
    if (!isEditInfoDialogOpen)
      setMetaDraft(extractPageMeta(editorState.markdown, editorState.title || (currentPage?.title ?? '')))
  }, [currentPage?.title, editorState.markdown, editorState.title, isEditInfoDialogOpen])

  useEffect(() => {
    setLeftPanelView('reference')
    clearReferenceImage()
  }, [pageId])

  useEffect(() => {
    if (!hasUnsavedEditorChanges || isGeneratingFromImage || isSaving)
      return

    const timeoutId = window.setTimeout(() => {
      void savePage(pageId, { silent: true })
    }, 1200)

    return () => window.clearTimeout(timeoutId)
  }, [
    editorState.markdown,
    editorState.title,
    hasUnsavedEditorChanges,
    isGeneratingFromImage,
    isSaving,
    pageId,
  ])

  function handleSelectedReference(file: File | null | undefined) {
    if (!file || isGeneratingFromImage)
      return

    void startGeneratingFromImage(pageId, file)
  }

  if (isMissingPage) {
    return (
      <section className="space-y-6">
        <PageHeading
          eyebrow="Editor"
          title="Page not found"
          description="The page may have been deleted, or this browser storage was cleared. Go back to the library to create a new one or open another saved page."
          actions={(
            <Button variant="outline" onClick={() => navigate({ to: '/' })}>
              Back to library
            </Button>
          )}
        />
        <Card>
          <CardContent className="py-10">
            <p className="text-center text-sm leading-6 text-muted-foreground">
              This page no longer exists. Return to the library and choose another page.
            </p>
          </CardContent>
        </Card>
      </section>
    )
  }

  if (!currentPage)
    return null

  return (
    <section className="space-y-6">
      <PageHeading
        eyebrow="Editor Workspace"
        title={editorState.title || currentPage.title}
        actions={(
          <>
            <Button
              variant="outline"
              onClick={() => {
                setMetaDraft(extractPageMeta(editorState.markdown, editorState.title || currentPage.title))
                setIsEditInfoDialogOpen(true)
              }}
              disabled={isGeneratingFromImage}
            >
              <FilePenLine className="size-4" />
              Edit details
            </Button>
            <Button variant="outline" onClick={() => navigate({ to: '/' })}>
              Back to library
            </Button>
            <Button onClick={() => savePage(pageId)} disabled={isSaving || isGeneratingFromImage}>
              <Save className="size-4" />
              {isSaving ? 'Saving...' : 'Save now'}
            </Button>
          </>
        )}
      />

      <div className="grid gap-6 xl:h-[calc(100dvh-13.5rem)] xl:grid-cols-2">
        <Card className="min-h-[620px] xl:min-h-0 xl:flex xl:flex-col">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>{leftPanelView === 'reference' ? 'Reference image' : 'Editor'}</CardTitle>
                <CardDescription>
                  {leftPanelView === 'reference'
                    ? 'Upload an image or inspect the current reference before generating Markdown.'
                    : 'Maintain the raw Markdown and directive content here.'}
                </CardDescription>
              </div>
              <div className="inline-flex rounded-lg border bg-muted/40 p-1">
                <button
                  type="button"
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    leftPanelView === 'reference'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  onClick={() => setLeftPanelView('reference')}
                >
                  Reference image
                </button>
                <button
                  type="button"
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    leftPanelView === 'editor'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  onClick={() => setLeftPanelView('editor')}
                >
                  Editor
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="min-h-0 flex-1">
            {leftPanelView === 'reference'
              ? (
                  <label
                    className={cn(
                      'flex min-h-[520px] cursor-pointer items-center justify-center rounded-lg border bg-muted/20 p-4 transition-colors xl:h-full xl:min-h-0 xl:overflow-y-auto',
                      isGeneratingFromImage && 'pointer-events-none opacity-60',
                      isDraggingReference && 'border-primary bg-primary/6',
                    )}
                    onDragEnter={(event) => {
                      event.preventDefault()
                      if (!isGeneratingFromImage)
                        setIsDraggingReference(true)
                    }}
                    onDragOver={(event) => {
                      event.preventDefault()
                      event.dataTransfer.dropEffect = 'copy'
                    }}
                    onDragLeave={(event) => {
                      event.preventDefault()
                      if (event.currentTarget.contains(event.relatedTarget as Node | null))
                        return

                      setIsDraggingReference(false)
                    }}
                    onDrop={(event) => {
                      event.preventDefault()
                      setIsDraggingReference(false)
                      handleSelectedReference(event.dataTransfer.files?.[0])
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        handleSelectedReference(event.target.files?.[0])
                        event.currentTarget.value = ''
                      }}
                    />

                    <div className="w-full space-y-4">
                      <div className="flex items-center justify-between gap-3 border-b pb-3 text-sm">
                        <div className="flex items-center gap-2 font-medium">
                          <ImageUp className="size-4" />
                          <span>
                            {isGeneratingFromImage
                              ? 'Generating from image...'
                              : imagePreviewUrl
                                ? 'Reference image'
                                : 'Upload image'}
                          </span>
                        </div>
                        <span className="text-muted-foreground">
                          {imagePreviewUrl ? 'Click or drop to replace' : 'Click or drop'}
                        </span>
                      </div>

                      {imagePreviewUrl
                        ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-3 text-sm">
                                <span className="font-medium">Current reference</span>
                                {imageSourceName && <span className="truncate text-muted-foreground">{imageSourceName}</span>}
                              </div>
                              <img
                                src={imagePreviewUrl}
                                alt={imageSourceName ?? 'Uploaded reference'}
                                className="max-h-[420px] w-full rounded-md object-contain"
                              />
                            </div>
                          )
                        : (
                            <div className="mx-auto max-w-sm space-y-3 text-center">
                              <div className="mx-auto flex size-12 items-center justify-center rounded-full border bg-background">
                                <ImageUp className="size-5" />
                              </div>
                              <p className="font-medium">No reference image yet</p>
                              <p className="text-sm leading-6 text-muted-foreground">
                                Upload a screenshot, UI mock, or visual reference here. Generated Markdown will appear in the editor and preview on the right.
                              </p>
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                Drag and drop an image here
                              </p>
                            </div>
                          )}
                    </div>
                  </label>
                )
              : (
                  <Textarea
                    className="min-h-[520px] resize-none font-['IBM_Plex_Mono','SFMono-Regular',Consolas,monospace] text-[0.95rem] leading-7 disabled:cursor-not-allowed disabled:opacity-60 xl:h-full xl:min-h-0"
                    value={editorState.markdown}
                    onChange={event => setEditorState({ ...editorState, markdown: event.target.value })}
                    spellCheck={false}
                    aria-label="Markdown input"
                    disabled={isGeneratingFromImage}
                  />
                )}
          </CardContent>
        </Card>

        <Card className="min-h-[620px] xl:min-h-0 xl:flex xl:flex-col">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>See the rendered Markdown and directive output in real time.</CardDescription>
          </CardHeader>
          <CardContent className="min-h-0 flex-1">
            <div className="min-h-[520px] rounded-lg border bg-muted/20 px-5 py-5 xl:h-full xl:min-h-0 xl:overflow-y-auto">
              {isGeneratingFromImage
                ? (
                    <div className="flex min-h-[520px] flex-col items-center justify-center gap-3 text-center xl:h-full xl:min-h-0">
                      <div className="size-10 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-foreground" />
                      <div className="space-y-1">
                        <p className="font-medium">Generating preview</p>
                        <p className="text-sm text-muted-foreground">
                          Your image has been uploaded. Waiting for the model response.
                        </p>
                      </div>
                    </div>
                  )
                : <MarkdownWithDirective markdown={deferredMarkdown} className={previewClassName} />}
            </div>
          </CardContent>
        </Card>
      </div>

      <EditPageInfoDialog
        draft={metaDraft}
        isOpen={isEditInfoDialogOpen}
        onChange={setMetaDraft}
        onClose={() => setIsEditInfoDialogOpen(false)}
        onSubmit={() => {
          setEditorState({
            title: metaDraft.title.trim() || currentPage.title,
            markdown: applyPageMeta(editorState.markdown, metaDraft),
          })
          setIsEditInfoDialogOpen(false)
        }}
      />
    </section>
  )
}
