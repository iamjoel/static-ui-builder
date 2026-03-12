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

const exampleDirectiveBlock = `## Directive 示例

::::withIconCardList
:::withIconCardItem{icon="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/2705.svg"}
渲染自定义卡片项
:::
:::withIconCardItem{icon="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4a1.svg"}
属性会先经过校验，再渲染
:::
::::
`

type Route
  = { name: 'editor', pageId: string }
    | { name: 'library' }

type EditorState = {
  markdown: string
  title: string
}

type GeneratedMarkdownPayload = {
  markdown: string
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

const timestampFormatter = new Intl.DateTimeFormat('zh-CN', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const previewClassName = 'text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_blockquote]:mb-4 [&_blockquote]:border-l [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_code]:rounded-md [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-[\'IBM_Plex_Mono\',\'SFMono-Regular\',Consolas,monospace] [&_code]:text-[0.92em] [&_h1]:mb-5 [&_h1]:text-[2rem] [&_h1]:font-semibold [&_h1]:tracking-[-0.04em] [&_h2]:mb-4 [&_h2]:mt-8 [&_h2]:text-[1.35rem] [&_h2]:font-semibold [&_h2]:tracking-[-0.03em] [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:text-[1.05rem] [&_h3]:font-semibold [&_h4]:mb-3 [&_h4]:mt-5 [&_h4]:text-sm [&_h4]:font-semibold [&_li+li]:mt-1.5 [&_ol]:mb-4 [&_ol]:pl-5 [&_p]:mb-4 [&_pre]:mb-4 [&_pre]:overflow-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-border [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:text-foreground [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit [&_ul]:mb-4 [&_ul]:pl-5'

function parseRoute(hash: string): Route {
  const normalized = hash.replace(/^#/, '')
  const [section = '', id = ''] = normalized.split('/').filter(Boolean)

  if (section === 'editor' && id)
    return { name: 'editor', pageId: id }

  return { name: 'library' }
}

function formatRoute(route: Route) {
  if (route.name === 'editor')
    return `#/editor/${route.pageId}`

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
    summary || '在这里开始编辑内容。',
    '',
    '## 内容',
    '',
    '- 在左侧修改 Markdown',
    '- 在右侧即时预览渲染结果',
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

function FeedbackBanner({
  message,
  onClose,
}: {
  message: string
  onClose: () => void
}) {
  return (
    <Card className="gap-4 border-primary/20 bg-primary/5 py-4">
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </div>
          <p className="text-sm leading-6 text-foreground">{message}</p>
        </div>
        <Button variant="ghost" onClick={onClose}>
          关闭
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
          <DialogTitle>编辑页面信息</DialogTitle>
          <DialogDescription>
            修改页面标题和顶部描述。确认后会同步更新当前 Markdown 草稿，仍需点击保存修改才会写入存储。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="edit-page-title">页面标题</label>
            <Input
              id="edit-page-title"
              value={draft.title}
              onChange={event => onChange({ ...draft, title: event.target.value })}
              placeholder="例如：AI 产品周报"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="edit-page-description">页面描述</label>
            <Textarea
              id="edit-page-description"
              rows={5}
              value={draft.description}
              onChange={event => onChange({ ...draft, description: event.target.value })}
              placeholder="会写入 Markdown 标题下方的首段描述。"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={onSubmit} disabled={!canSubmit}>
            <FilePenLine className="size-4" />
            应用修改
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
          <DialogTitle>新建页面</DialogTitle>
          <DialogDescription>
            先填写页面标题和摘要。创建成功后会先保存到浏览器，再跳转到独立编辑页继续编辑。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="page-title">页面标题</label>
            <Input
              id="page-title"
              value={draft.title}
              onChange={event => onChange({ ...draft, title: event.target.value })}
              placeholder="例如：AI 产品周报"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="page-summary">页面摘要</label>
            <Textarea
              id="page-summary"
              rows={5}
              value={draft.summary}
              onChange={event => onChange({ ...draft, summary: event.target.value })}
              placeholder="可选。会作为新页面开头内容。"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            取消
          </Button>
          <Button onClick={onSubmit} disabled={!canSubmit}>
            <Plus className="size-4" />
            {isSubmitting ? '创建中...' : '创建并进入编辑页'}
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
          <AlertDialogTitle>删除页面</AlertDialogTitle>
          <AlertDialogDescription>
            {page
              ? `确认删除「${page.title}」吗？这会同时删除浏览器里保存的内容。`
              : '确认删除当前页面吗？'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
          <AlertDialogAction
            className={cn(isDeleting && 'pointer-events-none opacity-50')}
            onClick={onConfirm}
          >
            {isDeleting ? '删除中...' : '确认删除'}
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
        title="页面库"
        description="用 shadcn-admin 的卡片和表格体系管理本地 Markdown 页面。创建入口、编辑入口和删除操作都从这里进入。"
        actions={(
          <Button onClick={onCreateClick} disabled={isCreating}>
            <Plus className="size-4" />
            {isCreating ? '创建中...' : '新建页面'}
          </Button>
        )}
      />

      <Card>
        <CardHeader>
          <CardTitle>已保存页面列表</CardTitle>
          <CardDescription>每一行都对应一个本地页面，可直接进入编辑器或删除。</CardDescription>
          <CardAction>
            <div className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
              共 {pages.length} 项
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="rounded-lg border border-dashed px-4 py-12 text-sm text-muted-foreground">
              正在读取浏览器中的已保存页面...
            </div>
          ) : pages.length === 0 ? (
            <div className="rounded-lg border border-dashed px-4 py-12">
              <div className="mx-auto max-w-xl text-center">
                <p className="text-lg font-semibold">还没有已保存页面</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  先创建一个页面，再进入编辑页继续写 Markdown、调试 directive，或者上传图片生成内容。
                </p>
                <Button className="mt-4" onClick={onCreateClick}>
                  <Plus className="size-4" />
                  新建第一个页面
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableCaption className="sr-only">已保存页面列表</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-4">标题</TableHead>
                    <TableHead className="px-4">内容预览</TableHead>
                    <TableHead className="px-4">最近更新</TableHead>
                    <TableHead className="px-4">创建时间</TableHead>
                    <TableHead className="px-4">存储位置</TableHead>
                    <TableHead className="px-4 text-right">操作</TableHead>
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
                          {describePreview(page.markdown) || '无预览内容'}
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
                            编辑
                          </Button>
                          <Button variant="ghost" onClick={() => onDeletePage(page)}>
                            <Trash2 className="size-4" />
                            删除
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
          title="页面不存在"
          description="它可能已经被删除，或者当前浏览器存储已经清空。回到页面库后可以重新创建，或者打开其他已保存页面。"
          actions={(
            <Button variant="outline" onClick={onBack}>
              返回页面库
            </Button>
          )}
        />
        <Card>
          <CardContent className="py-10">
            <p className="text-center text-sm leading-6 text-muted-foreground">
              当前页面已不存在。请返回列表页重新选择。
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
            >
              <FilePenLine className="size-4" />
              编辑信息
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
                {isGeneratingFromImage ? '识别中...' : '上传图片'}
              </label>
            </Button>
            <Button variant="outline" onClick={onBack}>
              返回页面库
            </Button>
            <Button onClick={onSave} disabled={isSaving || isGeneratingFromImage}>
              <Save className="size-4" />
              {isSaving ? '保存中...' : '保存修改'}
            </Button>
          </>
        )}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="min-h-[620px]">
          <CardHeader>
            <CardTitle>编辑内容</CardTitle>
            <CardDescription>左侧维护原始 Markdown 和 directive 文本。</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <Textarea
              className="min-h-[520px] resize-none font-['IBM_Plex_Mono','SFMono-Regular',Consolas,monospace] text-[0.95rem] leading-7"
              value={editorState.markdown}
              onChange={event => onChange({ ...editorState, markdown: event.target.value })}
              spellCheck={false}
              aria-label="Markdown input"
            />
          </CardContent>
        </Card>

        <Card className="min-h-[620px]">
          <CardHeader>
            <CardTitle>渲染预览</CardTitle>
            <CardDescription>右侧实时展示 Markdown 渲染结果和 directive 组件输出。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {imagePreviewUrl && (
              <div className="overflow-hidden rounded-lg border bg-muted/20">
                <div className="flex items-center justify-between border-b px-4 py-3 text-sm">
                  <span className="font-medium">参考图片</span>
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
              <MarkdownWithDirective markdown={deferredMarkdown} className={previewClassName} />
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
  const [feedback, setFeedback] = useState<string | null>(null)
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

  async function handleSave() {
    if (!currentPage)
      return

    setIsSaving(true)
    setFeedback(null)

    try {
      await repository.update(currentPage.id, {
        title: editorState.title.trim() || currentPage.title,
        markdown: editorState.markdown,
      })
      await refreshPages()
      setFeedback('页面已更新到浏览器存储。')
    }
    catch (error) {
      setFeedback(error instanceof Error ? error.message : '保存失败。')
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
      setFeedback('页面已删除。')

      if (route.name === 'editor' && route.pageId === deleteTarget.id)
        navigate({ name: 'library' })
    }
    catch (error) {
      setFeedback(error instanceof Error ? error.message : '删除失败。')
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
    setFeedback(null)

    try {
      const createdPage = await repository.create({
        title: createDraft.title.trim(),
        markdown: createInitialMarkdown(createDraft),
      })

      await refreshPages()
      setCreateDraft(blankCreateDraft)
      setIsCreateDialogOpen(false)
      setFeedback('页面已创建，已跳转到编辑页。')
      navigate({ name: 'editor', pageId: createdPage.id })
    }
    catch (error) {
      setFeedback(error instanceof Error ? error.message : '创建失败。')
    }
    finally {
      setIsCreating(false)
    }
  }

  async function handleGenerateFromImage(file: File) {
    if (!currentPage)
      return

    if (file.size > 5 * 1024 * 1024) {
      setFeedback('图片过大，请上传 5MB 以内的图片。')
      return
    }

    if ((editorState.markdown.trim() || editorState.title.trim())
      && !window.confirm('将用 AI 生成的 Markdown 覆盖当前编辑内容，是否继续？')) {
      return
    }

    setIsGeneratingFromImage(true)
    setFeedback(null)

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
      if (!response.ok || !('markdown' in result) || !('title' in result))
        throw new Error('error' in result && result.error ? result.error : 'AI 生成失败。')

      setEditorState({
        title: result.title,
        markdown: result.markdown,
      })
      setFeedback(`已根据图片 ${file.name} 生成 Markdown，请检查后保存。`)
    }
    catch (error) {
      setFeedback(error instanceof Error ? error.message : 'AI 生成失败。')
    }
    finally {
      setIsGeneratingFromImage(false)
    }
  }

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
                    tooltip="页面库"
                    isActive={route.name === 'library'}
                    onClick={() => navigate({ name: 'library' })}
                  >
                    <Library className="size-4" />
                    <span>页面库</span>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>{pages.length}</SidebarMenuBadge>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="编辑器"
                    isActive={route.name === 'editor'}
                    onClick={() => route.name === 'editor' && currentPage ? navigate(route) : navigate({ name: 'library' })}
                  >
                    <FilePenLine className="size-4" />
                    <span>编辑器</span>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>{route.name === 'editor' ? 'open' : '-'}</SidebarMenuBadge>
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
              {route.name === 'library' ? 'Library Dashboard' : 'Editor Dashboard'}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {route.name === 'library'
                ? 'shadcn-admin table workspace'
                : currentPage?.title ?? '内容编辑'}
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
          {feedback && <FeedbackBanner message={feedback} onClose={() => setFeedback(null)} />}

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
