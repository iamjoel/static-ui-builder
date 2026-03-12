import { startTransition, useDeferredValue, useEffect, useState, type ReactNode } from 'react'
import {
  FilePenLine,
  ImageUp,
  Layers3,
  Library,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { MarkdownWithDirective } from './components/markdown-with-directive'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './components/ui/alert-dialog'
import { Button } from './components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './components/ui/dialog'
import { Input } from './components/ui/input'
import { Separator } from './components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from './components/ui/sidebar'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './components/ui/table'
import { Textarea } from './components/ui/textarea'
import {
  BrowserSavedPageRepository,
  type SavedPage,
} from './features/saved-pages/repository'
import { cn } from './lib/utils'
import {
  directiveComponentRegistry,
  type DirectiveName,
} from './components/markdown-with-directive/components/markdown-with-directive-schema'

const exampleDirectiveBlock = `## Directive example

::::withIconCardList
:::withIconCardItem{icon="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/2705.svg"}
Render custom card items
:::
:::withIconCardItem{icon="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4a1.svg"}
Attributes are validated before rendering
:::
::::
`

type Route
  = { name: 'editor', pageId: string }
    | { name: 'library' }
    | { directiveName?: DirectiveName, name: 'components' }

type EditorState = {
  markdown: string
  title: string
}

type GeneratedMarkdownPayload = {
  error?: string
  markdown: string
  rawText?: string
  title: string
}

type CreatePageDraft = {
  summary: string
  title: string
}

type CreatePageDialogProps = {
  draft: CreatePageDraft
  isOpen: boolean
  isSubmitting: boolean
  onChange: (draft: CreatePageDraft) => void
  onClose: () => void
  onSubmit: () => void
}

type DeletePageDialogProps = {
  isDeleting: boolean
  page: SavedPage | null
  onClose: () => void
  onConfirm: () => void
}

type PageMetaDraft = {
  description: string
  title: string
}

type ToastState = {
  id: number
  message: string
  tone: 'error' | 'info' | 'success'
}

type LibraryPageProps = {
  isCreating: boolean
  isLoading: boolean
  onCreateClick: () => void
  onDeletePage: (page: SavedPage) => void
  onEditPage: (id: string) => void
  pages: SavedPage[]
}

type EditorPageProps = {
  currentPage: SavedPage | null
  editorState: EditorState
  imagePreviewUrl: string | null
  imageSourceName: string | null
  isGeneratingFromImage: boolean
  isMissingPage: boolean
  isSaving: boolean
  onBack: () => void
  onChange: (state: EditorState) => void
  onGenerateFromImage: (file: File) => void
  onSave: () => void
}

const blankCreateDraft: CreatePageDraft = {
  title: '',
  summary: '',
}

const blankEditorState: EditorState = {
  title: '',
  markdown: '',
}

const timestampFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const previewClassName = 'text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_blockquote]:mb-4 [&_blockquote]:border-l [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_code]:rounded-md [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-[\'IBM_Plex_Mono\',\'SFMono-Regular\',Consolas,monospace] [&_code]:text-[0.92em] [&_h1]:mb-5 [&_h1]:text-[2rem] [&_h1]:font-semibold [&_h1]:tracking-[-0.04em] [&_h2]:mb-4 [&_h2]:mt-8 [&_h2]:text-[1.35rem] [&_h2]:font-semibold [&_h2]:tracking-[-0.03em] [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:text-[1.05rem] [&_h3]:font-semibold [&_h4]:mb-3 [&_h4]:mt-5 [&_h4]:text-sm [&_h4]:font-semibold [&_li+li]:mt-1.5 [&_ol]:mb-4 [&_ol]:pl-5 [&_p]:mb-4 [&_pre]:mb-4 [&_pre]:overflow-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-border [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:text-foreground [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit [&_ul]:mb-4 [&_ul]:pl-5'
const showcaseDirectiveNames = [
  'callout',
  'featuregrid',
  'featureitem',
  'statscards',
  'statcard',
  'comparecards',
  'comparecard',
] as const satisfies DirectiveName[]
const showcaseDirectiveNameSet = new Set<DirectiveName>(showcaseDirectiveNames)

function parseRoute(hash: string): Route {
  const normalized = hash.replace(/^#/, '')
  const [section = '', id = ''] = normalized.split('/').filter(Boolean)

  if (section === 'editor' && id)
    return { name: 'editor', pageId: id }

  if (section === 'components') {
    if (id && showcaseDirectiveNameSet.has(id as DirectiveName))
      return { name: 'components', directiveName: id as DirectiveName }

    return { name: 'components' }
  }

  return { name: 'library' }
}

function formatRoute(route: Route) {
  if (route.name === 'editor')
    return `#/editor/${route.pageId}`

  if (route.name === 'components')
    return route.directiveName ? `#/components/${route.directiveName}` : '#/components'

  return '#/library'
}

function describePreview(markdown: string) {
  return markdown
    .replace(/:{2,}[^\n]*/g, ' ')
    .replace(/[#>*`\-\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function formatTimestamp(value: string) {
  return timestampFormatter.format(new Date(value))
}

function createInitialMarkdown(draft: CreatePageDraft) {
  const title = draft.title.trim() || 'Untitled page'
  const summary = draft.summary.trim()

  return [
    `# ${title}`,
    '',
    summary || 'Start writing here.',
    '',
    '## Content',
    '',
    '- Edit Markdown on the left',
    '- Preview the rendered result on the right',
    '',
    exampleDirectiveBlock,
  ].join('\n')
}

function isMarkdownBlockStart(line: string) {
  const trimmed = line.trim()
  return /^(#{1,6}\s|[-*+]\s|\d+\.\s|```|~~~|:::+|>\s?)/.test(trimmed)
}

function extractPageMeta(markdown: string, fallbackTitle: string): PageMetaDraft {
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

function applyPageMeta(markdown: string, draft: PageMetaDraft) {
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

function readFileAsDataUrl(file: File) {
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

function AppBrand() {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-background px-3 py-3 shadow-xs">
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Layers3 className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">Static UI Builder</p>
        <p className="truncate text-xs text-muted-foreground">shadcn-admin workspace</p>
      </div>
    </div>
  )
}

function PageHeading({
  actions,
  description,
  eyebrow,
  title,
}: {
  actions?: ReactNode
  description?: string
  eyebrow: string
  title: string
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
          {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

function ToastNotice({
  onClose,
  toast,
}: {
  onClose: () => void
  toast: ToastState
}) {
  const toneClassName = toast.tone === 'error'
    ? 'border-destructive/20 bg-destructive/5'
    : toast.tone === 'success'
      ? 'border-primary/20 bg-primary/5'
      : 'border-border bg-background/95'

  return (
    <Card className={cn('fixed right-4 top-4 z-50 w-[min(420px,calc(100vw-2rem))] gap-4 py-4 shadow-lg', toneClassName)}>
      <CardContent className="flex items-start gap-3 sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </div>
          <p className="pr-3 text-sm leading-6 text-foreground">{toast.message}</p>
        </div>
        <Button variant="ghost" onClick={onClose}>
          Dismiss
        </Button>
      </CardContent>
    </Card>
  )
}

function EditPageInfoDialog({
  draft,
  isOpen,
  onChange,
  onClose,
  onSubmit,
}: {
  draft: PageMetaDraft
  isOpen: boolean
  onChange: (draft: PageMetaDraft) => void
  onClose: () => void
  onSubmit: () => void
}) {
  const canSubmit = draft.title.trim().length > 0

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Page Details</DialogTitle>
          <DialogDescription>
            Update the page title and top description. This changes the current Markdown draft and will be saved automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="edit-page-title">Page title</label>
            <Input
              id="edit-page-title"
              value={draft.title}
              onChange={event => onChange({ ...draft, title: event.target.value })}
              placeholder="For example: AI product weekly"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="edit-page-description">Page description</label>
            <Textarea
              id="edit-page-description"
              rows={5}
              value={draft.description}
              onChange={event => onChange({ ...draft, description: event.target.value })}
              placeholder="This will be written below the Markdown title."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!canSubmit}>
            <FilePenLine className="size-4" />
            Apply changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CreatePageDialog({
  draft,
  isOpen,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
}: CreatePageDialogProps) {
  const canSubmit = draft.title.trim().length > 0 && !isSubmitting

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isSubmitting)
          onClose()
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Page</DialogTitle>
          <DialogDescription>
            Add a page title and summary first. The page will be saved locally and opened in the editor right away.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="page-title">Page title</label>
            <Input
              id="page-title"
              value={draft.title}
              onChange={event => onChange({ ...draft, title: event.target.value })}
              placeholder="For example: AI product weekly"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="page-summary">Page summary</label>
            <Textarea
              id="page-summary"
              rows={5}
              value={draft.summary}
              onChange={event => onChange({ ...draft, summary: event.target.value })}
              placeholder="Optional. This becomes the opening paragraph of the new page."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!canSubmit}>
            <Plus className="size-4" />
            {isSubmitting ? 'Creating...' : 'Create and open editor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeletePageDialog({
  isDeleting,
  page,
  onClose,
  onConfirm,
}: DeletePageDialogProps) {
  return (
    <AlertDialog open={Boolean(page)} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Page</AlertDialogTitle>
          <AlertDialogDescription>
            {page
              ? `Delete "${page.title}"? This will remove the saved local content as well.`
              : 'Delete this page?'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={cn(isDeleting && 'pointer-events-none opacity-50')}
            onClick={onConfirm}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function LibraryPage({
  isCreating,
  isLoading,
  onCreateClick,
  onDeletePage,
  onEditPage,
  pages,
}: LibraryPageProps) {
  return (
    <section className="space-y-6">
      <PageHeading
        eyebrow="Content Library"
        title="Pages"
        description="Manage local Markdown pages with the shadcn-admin card and table system."
        actions={(
          <Button onClick={onCreateClick} disabled={isCreating}>
            <Plus className="size-4" />
            {isCreating ? 'Creating...' : 'New page'}
          </Button>
        )}
      />

      <Card>
        <CardHeader>
          <CardTitle>Saved pages</CardTitle>
          <CardDescription>Each row maps to one local page and can be opened or deleted directly.</CardDescription>
          <CardAction>
            <div className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
              {pages.length} items
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="rounded-lg border border-dashed px-4 py-12 text-sm text-muted-foreground">
              Loading saved pages from browser storage...
            </div>
          ) : pages.length === 0 ? (
            <div className="rounded-lg border border-dashed px-4 py-12">
              <div className="mx-auto max-w-xl text-center">
                <p className="text-lg font-semibold">No saved pages yet</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Create a page first, then continue editing Markdown, testing directives, or generating content from an image.
                </p>
                <Button className="mt-4" onClick={onCreateClick}>
                  <Plus className="size-4" />
                  Create your first page
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableCaption className="sr-only">Saved pages</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-4">Title</TableHead>
                    <TableHead className="px-4">Preview</TableHead>
                    <TableHead className="px-4">Last updated</TableHead>
                    <TableHead className="px-4">Created</TableHead>
                    <TableHead className="px-4">Storage</TableHead>
                    <TableHead className="px-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map(page => (
                    <TableRow key={page.id}>
                      <TableCell className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="font-medium">{page.title}</p>
                          <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                            {page.markdown.length} chars
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[420px] whitespace-normal px-4 py-4">
                        <p className="line-clamp-2 whitespace-normal text-sm leading-6 text-muted-foreground">
                          {describePreview(page.markdown) || 'No preview content'}
                        </p>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-muted-foreground">
                        {formatTimestamp(page.updatedAt)}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-muted-foreground">
                        {formatTimestamp(page.createdAt)}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                          localStorage
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => onEditPage(page.id)}>
                            <FilePenLine className="size-4" />
                            Edit
                          </Button>
                          <Button variant="ghost" onClick={() => onDeletePage(page)}>
                            <Trash2 className="size-4" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

type ComponentShowcaseEntry = {
  description: string
  directiveName: DirectiveName
  label: string
}

const componentShowcaseEntries: ComponentShowcaseEntry[] = showcaseDirectiveNames.map((directiveName) => ({
  directiveName,
  label: directiveComponentRegistry[directiveName].directiveName,
  description: directiveComponentRegistry[directiveName].description,
}))

type ComponentsShowcasePageProps = {
  activeDirectiveName?: DirectiveName
  onSelectDirective: (directiveName: DirectiveName) => void
}

function ComponentsShowcasePage({
  activeDirectiveName,
  onSelectDirective,
}: ComponentsShowcasePageProps) {
  const fallbackDirectiveName = componentShowcaseEntries[0]?.directiveName
  const selectedDirectiveName = activeDirectiveName && showcaseDirectiveNameSet.has(activeDirectiveName)
    ? activeDirectiveName
    : fallbackDirectiveName

  if (!selectedDirectiveName)
    return null

  const selectedDirective = directiveComponentRegistry[selectedDirectiveName]
  const selectedMarkdown = selectedDirective.fewShotExamples[0]?.markdown ?? ''
  const selectedAllowedAttributes = selectedDirective.allowedAttributes.join(', ') || 'none'

  return (
    <section className="space-y-6">
      <PageHeading
        eyebrow="Component Gallery"
        title="Static Markdown Components"
        description="Browse the display-only directives available for product and content presentation layouts."
      />

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="xl:sticky xl:top-24">
          <CardHeader>
            <CardTitle>Components</CardTitle>
            <CardDescription>Select a directive to inspect its usage and preview.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {componentShowcaseEntries.map(entry => (
              <button
                key={entry.directiveName}
                type="button"
                onClick={() => onSelectDirective(entry.directiveName)}
                className={cn(
                  'w-full rounded-xl border px-3 py-3 text-left transition-colors',
                  entry.directiveName === selectedDirectiveName
                    ? 'border-primary/25 bg-primary/6'
                    : 'hover:bg-muted/60',
                )}
              >
                <p className="text-sm font-semibold">{entry.label}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{entry.description}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{selectedDirective.directiveName}</CardTitle>
              <CardDescription>{selectedDirective.uiDescription}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Description</p>
                  <p className="mt-2 text-sm leading-6">{selectedDirective.description}</p>
                </div>
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Allowed attributes</p>
                  <p className="mt-2 text-sm leading-6">{selectedAllowedAttributes}</p>
                </div>
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Best use cases</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
                    {selectedDirective.useCases.map(useCase => (
                      <li key={useCase}>{useCase}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Generation notes</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
                  {selectedDirective.generationNotes.map(note => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 2xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>Rendered from the first showcase example for this directive.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border bg-muted/20 px-5 py-5">
                  <MarkdownWithDirective markdown={selectedMarkdown} className={previewClassName} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Markdown example</CardTitle>
                <CardDescription>Copy this structure when authoring or prompting for this directive.</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="overflow-auto rounded-xl border bg-muted p-4 text-sm leading-6 text-foreground">
                  <code>{selectedMarkdown}</code>
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}

function EditorPage({
  currentPage,
  editorState,
  imagePreviewUrl,
  imageSourceName,
  isGeneratingFromImage,
  isMissingPage,
  isSaving,
  onBack,
  onChange,
  onGenerateFromImage,
  onSave,
}: EditorPageProps) {
  const deferredMarkdown = useDeferredValue(editorState.markdown)
  const [isEditInfoDialogOpen, setIsEditInfoDialogOpen] = useState(false)
  const [metaDraft, setMetaDraft] = useState<PageMetaDraft>(() =>
    extractPageMeta(editorState.markdown, editorState.title || (currentPage?.title ?? '')),
  )

  useEffect(() => {
    if (!isEditInfoDialogOpen)
      setMetaDraft(extractPageMeta(editorState.markdown, editorState.title || (currentPage?.title ?? '')))
  }, [currentPage?.title, editorState.markdown, editorState.title, isEditInfoDialogOpen])

  if (isMissingPage) {
    return (
      <section className="space-y-6">
        <PageHeading
          eyebrow="Editor"
          title="Page not found"
          description="The page may have been deleted, or this browser storage was cleared. Go back to the library to create a new one or open another saved page."
          actions={(
            <Button variant="outline" onClick={onBack}>
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
            <Button
              variant="outline"
              asChild
              className={cn(isGeneratingFromImage && 'pointer-events-none opacity-50')}
            >
              <label>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    event.currentTarget.value = ''
                    if (file)
                      onGenerateFromImage(file)
                  }}
                />
                <ImageUp className="size-4" />
                {isGeneratingFromImage ? 'Generating...' : 'Upload image'}
              </label>
            </Button>
            <Button variant="outline" onClick={onBack}>
              Back to library
            </Button>
            <Button onClick={onSave} disabled={isSaving || isGeneratingFromImage}>
              <Save className="size-4" />
              {isSaving ? 'Saving...' : 'Save now'}
            </Button>
          </>
        )}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="min-h-[620px]">
          <CardHeader>
            <CardTitle>Editor</CardTitle>
            <CardDescription>Maintain the raw Markdown and directive content here.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <Textarea
              className="min-h-[520px] resize-none font-['IBM_Plex_Mono','SFMono-Regular',Consolas,monospace] text-[0.95rem] leading-7 disabled:cursor-not-allowed disabled:opacity-60"
              value={editorState.markdown}
              onChange={event => onChange({ ...editorState, markdown: event.target.value })}
              spellCheck={false}
              aria-label="Markdown input"
              disabled={isGeneratingFromImage}
            />
          </CardContent>
        </Card>

        <Card className="min-h-[620px]">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>See the rendered Markdown and directive output in real time.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {imagePreviewUrl && (
              <div className="overflow-hidden rounded-lg border bg-muted/20">
                <div className="flex items-center justify-between border-b px-4 py-3 text-sm">
                  <span className="font-medium">Reference image</span>
                  <span className="max-w-[60%] truncate text-muted-foreground">{imageSourceName}</span>
                </div>
                <div className="bg-background p-4">
                  <img
                    src={imagePreviewUrl}
                    alt={imageSourceName ?? 'Uploaded reference'}
                    className="max-h-[260px] w-full rounded-md object-contain"
                  />
                </div>
              </div>
            )}

            <div className="min-h-[520px] rounded-lg border bg-muted/20 px-5 py-5">
              {isGeneratingFromImage
                ? (
                    <div className="flex min-h-[520px] flex-col items-center justify-center gap-3 text-center">
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
          onChange({
            title: metaDraft.title.trim() || currentPage.title,
            markdown: applyPageMeta(editorState.markdown, metaDraft),
          })
          setIsEditInfoDialogOpen(false)
        }}
      />
    </section>
  )
}

function App() {
  const [repository] = useState(() => new BrowserSavedPageRepository(window.localStorage))
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash))
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

  const currentPage = route.name === 'editor'
    ? pages.find(page => page.id === route.pageId) ?? null
    : null
  const isMissingPage = route.name === 'editor' && !currentPage && !isLoading
  const hasUnsavedEditorChanges = route.name === 'editor'
    && currentPage
    && ((editorState.title.trim() || currentPage.title) !== currentPage.title
      || editorState.markdown !== currentPage.markdown)

  function navigate(nextRoute: Route) {
    const nextHash = formatRoute(nextRoute)
    startTransition(() => {
      setRoute(nextRoute)
      window.location.hash = nextHash
    })
  }

  async function refreshPages() {
    setPages(await repository.list())
  }

  function showToast(message: string, tone: ToastState['tone'] = 'info') {
    setToast({
      id: Date.now(),
      message,
      tone,
    })
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
    function handleHashChange() {
      startTransition(() => {
        setRoute(parseRoute(window.location.hash))
      })
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    if (route.name !== 'editor' || !currentPage)
      return

    setEditorState({
      title: currentPage.title,
      markdown: currentPage.markdown,
    })
  }, [currentPage, route])

  useEffect(() => {
    if (route.name === 'editor')
      setIsCreateDialogOpen(false)
  }, [route])

  useEffect(() => {
    setImagePreviewUrl(null)
    setImageSourceName(null)
  }, [currentPage?.id])

  useEffect(() => {
    if (!toast)
      return

    const timeoutId = window.setTimeout(() => {
      setToast(current => current?.id === toast.id ? null : current)
    }, 3200)

    return () => window.clearTimeout(timeoutId)
  }, [toast])

  async function handleSave(options?: { silent?: boolean }) {
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

  async function handleDeleteConfirmed() {
    if (!deleteTarget)
      return

    setIsDeleting(true)

    try {
      await repository.delete(deleteTarget.id)
      await refreshPages()
      showToast('Successed', 'success')

      if (route.name === 'editor' && route.pageId === deleteTarget.id)
        navigate({ name: 'library' })
    }
    catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to delete page.', 'error')
    }
    finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  async function handleCreatePage() {
    if (!createDraft.title.trim())
      return

    setIsCreating(true)

    try {
      const createdPage = await repository.create({
        title: createDraft.title.trim(),
        markdown: createInitialMarkdown(createDraft),
      })

      await refreshPages()
      setCreateDraft(blankCreateDraft)
      setIsCreateDialogOpen(false)
      showToast('Successed', 'success')
      navigate({ name: 'editor', pageId: createdPage.id })
    }
    catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create page.', 'error')
    }
    finally {
      setIsCreating(false)
    }
  }

  async function handleGenerateFromImage(file: File) {
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

  useEffect(() => {
    if (!hasUnsavedEditorChanges || isGeneratingFromImage || isSaving)
      return

    const timeoutId = window.setTimeout(() => {
      void handleSave({ silent: true })
    }, 1200)

    return () => window.clearTimeout(timeoutId)
  }, [
    currentPage,
    editorState.markdown,
    editorState.title,
    hasUnsavedEditorChanges,
    isGeneratingFromImage,
    isSaving,
  ])

  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <AppBrand />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Pages"
                    isActive={route.name === 'library'}
                    onClick={() => navigate({ name: 'library' })}
                  >
                    <Library className="size-4" />
                    <span>Pages</span>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>{pages.length}</SidebarMenuBadge>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Editor"
                    isActive={route.name === 'editor'}
                    onClick={() => route.name === 'editor' && currentPage ? navigate(route) : navigate({ name: 'library' })}
                  >
                    <FilePenLine className="size-4" />
                    <span>Editor</span>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>{route.name === 'editor' ? 'open' : '-'}</SidebarMenuBadge>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Components"
                    isActive={route.name === 'components'}
                    onClick={() => navigate({ name: 'components' })}
                  >
                    <Layers3 className="size-4" />
                    <span>Components</span>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>{showcaseDirectiveNames.length}</SidebarMenuBadge>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="@container/content">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur sm:px-6">
          <SidebarTrigger variant="outline" className="size-8" />
          <Separator orientation="vertical" className="h-4" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              {route.name === 'library'
                ? 'Library Dashboard'
                : route.name === 'components'
                  ? 'Component Gallery'
                  : 'Editor Dashboard'}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {route.name === 'library'
                ? 'shadcn-admin table workspace'
                : route.name === 'components'
                  ? 'Static display directives'
                  : currentPage?.title ?? 'Content editor'}
            </p>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <span className="rounded-md border bg-muted px-2 py-1 text-xs text-muted-foreground">
              Browser storage
            </span>
            <span className="rounded-md border bg-primary/5 px-2 py-1 text-xs text-foreground">
              Gemini enabled
            </span>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-4 sm:p-6">
          {route.name === 'library'
            ? (
                <LibraryPage
                  isCreating={isCreating}
                  isLoading={isLoading}
                  onCreateClick={() => setIsCreateDialogOpen(true)}
                  onDeletePage={setDeleteTarget}
                  onEditPage={pageId => navigate({ name: 'editor', pageId })}
                  pages={pages}
                />
              )
            : route.name === 'components'
              ? (
                  <ComponentsShowcasePage
                    activeDirectiveName={route.directiveName}
                    onSelectDirective={directiveName => navigate({ name: 'components', directiveName })}
                  />
                )
            : (
                <EditorPage
                  currentPage={currentPage}
                  editorState={editorState}
                  imagePreviewUrl={imagePreviewUrl}
                  imageSourceName={imageSourceName}
                  isGeneratingFromImage={isGeneratingFromImage}
                  isMissingPage={isMissingPage}
                  isSaving={isSaving}
                  onBack={() => navigate({ name: 'library' })}
                  onChange={setEditorState}
                  onGenerateFromImage={handleGenerateFromImage}
                  onSave={handleSave}
                />
              )}
        </main>
      </SidebarInset>

      {toast && <ToastNotice toast={toast} onClose={() => setToast(null)} />}

      <CreatePageDialog
        draft={createDraft}
        isOpen={isCreateDialogOpen}
        isSubmitting={isCreating}
        onChange={setCreateDraft}
        onClose={() => {
          setIsCreateDialogOpen(false)
          setCreateDraft(blankCreateDraft)
        }}
        onSubmit={handleCreatePage}
      />

      <DeletePageDialog
        page={deleteTarget}
        isDeleting={isDeleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirmed}
      />
    </SidebarProvider>
  )
}

export default App
