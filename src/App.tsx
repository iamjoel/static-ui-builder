import { startTransition, useDeferredValue, useEffect, useState } from 'react'
import { MarkdownWithDirective } from './components/markdown-with-directive'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './components/ui/table'
import {
  BrowserSavedPageRepository,
  type SavedPage,
} from './features/saved-pages/repository'
import { cn } from './utils/classnames'

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

type CreatePageModalProps = {
  draft: CreatePageDraft
  isOpen: boolean
  isSubmitting: boolean
  onChange: (draft: CreatePageDraft) => void
  onClose: () => void
  onSubmit: () => void
}

type LibraryPageProps = {
  isCreating: boolean
  isLoading: boolean
  onCreateClick: () => void
  onDeletePage: (id: string) => void
  onEditPage: (id: string) => void
  pages: SavedPage[]
}

type EditorPageProps = {
  currentPage: SavedPage | null
  editorState: EditorState
  imageSourceName: string | null
  isGeneratingFromImage: boolean
  isMissingPage: boolean
  isSaving: boolean
  onBack: () => void
  onChange: (state: EditorState) => void
  onDelete: (id: string) => void
  onGenerateFromImage: (file: File) => void
  onSave: () => void
}

const timestampFormatter = new Intl.DateTimeFormat('zh-CN', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const blankCreateDraft: CreatePageDraft = {
  title: '',
  summary: '',
}

const blankEditorState: EditorState = {
  title: '',
  markdown: '',
}

const previewClassName = 'text-[#18181b] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_a]:text-[#18181b] [&_a]:underline [&_blockquote]:mb-4 [&_blockquote]:border-l [&_blockquote]:border-[#d4d4d8] [&_blockquote]:pl-4 [&_blockquote]:text-[#52525b] [&_code]:rounded-sm [&_code]:bg-[#f4f4f5] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-[\'IBM_Plex_Mono\',\'SFMono-Regular\',Consolas,monospace] [&_code]:text-[0.92em] [&_h1]:mb-5 [&_h1]:text-[2rem] [&_h1]:font-semibold [&_h1]:tracking-[-0.04em] [&_h2]:mb-4 [&_h2]:mt-8 [&_h2]:text-[1.35rem] [&_h2]:font-semibold [&_h2]:tracking-[-0.03em] [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:text-[1.05rem] [&_h3]:font-semibold [&_h4]:mb-3 [&_h4]:mt-5 [&_h4]:text-sm [&_h4]:font-semibold [&_li+li]:mt-1.5 [&_ol]:mb-4 [&_ol]:pl-5 [&_p]:mb-4 [&_pre]:mb-4 [&_pre]:overflow-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-[#e4e4e7] [&_pre]:bg-[#fafafa] [&_pre]:p-4 [&_pre]:text-[#18181b] [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit [&_ul]:mb-4 [&_ul]:pl-5'

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

function CreatePageModal({
  draft,
  isOpen,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
}: CreatePageModalProps) {
  useEffect(() => {
    if (!isOpen)
      return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting)
        onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen)
    return null

  const canSubmit = draft.title.trim().length > 0 && !isSubmitting

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(9,9,11,0.28)] px-4 py-6">
      <div className="w-full max-w-[560px] rounded-2xl border border-[#e4e4e7] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="border-b border-[#e4e4e7] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-[#71717a]">
                Create Page
              </p>
              <h2 className="m-0 text-[1.75rem] leading-none tracking-[-0.04em] text-[#09090b]">
                新建页面
              </h2>
              <p className="mb-0 mt-3 max-w-[420px] text-sm leading-6 text-[#52525b]">
                先填写基础信息，创建成功后直接进入编辑页。
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-md border border-[#e4e4e7] bg-white px-3 py-2 text-sm text-[#3f3f46] transition hover:bg-[#fafafa] disabled:cursor-not-allowed disabled:opacity-60"
            >
              关闭
            </button>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-[#71717a]">
              页面标题
            </span>
            <input
              value={draft.title}
              onChange={event => onChange({ ...draft, title: event.target.value })}
              placeholder="例如：AI 产品路线图"
              className="w-full rounded-lg border border-[#e4e4e7] bg-white px-3 py-2.5 text-sm text-[#09090b] outline-none transition placeholder:text-[#a1a1aa] focus:border-[#18181b]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-[#71717a]">
              页面简介
            </span>
            <textarea
              value={draft.summary}
              onChange={event => onChange({ ...draft, summary: event.target.value })}
              placeholder="可选。会被放进新页面开头作为编辑起点。"
              rows={4}
              className="w-full resize-none rounded-lg border border-[#e4e4e7] bg-white px-3 py-2.5 text-sm leading-6 text-[#09090b] outline-none transition placeholder:text-[#a1a1aa] focus:border-[#18181b]"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e4e4e7] bg-[#fafafa] px-6 py-4 text-sm text-[#52525b]">
          <span>创建后会先保存到浏览器，再跳转到编辑页。</span>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className="rounded-md bg-[#18181b] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? '创建中...' : '创建并进入编辑页'}
          </button>
        </div>
      </div>
    </div>
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
      <div className="flex flex-col gap-4 border-b border-[#e4e4e7] pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-[#71717a]">
            Saved Pages
          </p>
          <h2 className="m-0 text-[2rem] leading-none tracking-[-0.04em] text-[#09090b]">
            列表页
          </h2>
          <p className="mb-0 mt-3 max-w-[640px] text-sm leading-6 text-[#52525b]">
            用表格管理浏览器中已保存的页面。创建入口收口在这里，编辑入口统一跳到独立编辑页。
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateClick}
          disabled={isCreating}
          className="inline-flex items-center justify-center rounded-md bg-[#18181b] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCreating ? '创建中...' : '新建页面'}
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-[#e4e4e7] bg-white px-5 py-10 text-sm text-[#52525b]">
          正在读取浏览器中的已保存页面...
        </div>
      ) : pages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#d4d4d8] bg-white px-5 py-10">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-[#71717a]">
            Empty Library
          </p>
          <h3 className="m-0 text-2xl tracking-[-0.03em] text-[#09090b]">
            还没有已保存页面
          </h3>
          <p className="mb-0 mt-3 max-w-[540px] text-sm leading-6 text-[#52525b]">
            从列表页点击“新建页面”，先在模态框里填写基础信息，创建成功后会跳到独立编辑页。
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#e4e4e7] bg-white">
          <Table>
            <TableCaption className="sr-only">
              已保存页面列表，可在此进入编辑页或删除页面。
            </TableCaption>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[220px]">标题</TableHead>
                <TableHead className="min-w-[320px]">内容预览</TableHead>
                <TableHead className="min-w-[160px]">最近更新</TableHead>
                <TableHead className="min-w-[160px]">创建时间</TableHead>
                <TableHead className="min-w-[120px]">存储位置</TableHead>
                <TableHead className="min-w-[180px] text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map(page => (
                <TableRow key={page.id}>
                  <TableCell className="min-w-[220px]">
                    <div className="space-y-2">
                      <p className="m-0 truncate text-sm font-medium text-[#09090b]">
                        {page.title}
                      </p>
                      <span className="inline-flex rounded-md border border-[#e4e4e7] bg-[#fafafa] px-2 py-1 text-xs text-[#71717a]">
                        {page.markdown.length} chars
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[420px]">
                    <p className="m-0 line-clamp-2 leading-6 text-[#52525b]">
                      {describePreview(page.markdown) || '无预览内容'}
                    </p>
                  </TableCell>
                  <TableCell className="text-[#52525b]">
                    {formatTimestamp(page.updatedAt)}
                  </TableCell>
                  <TableCell className="text-[#52525b]">
                    {formatTimestamp(page.createdAt)}
                  </TableCell>
                  <TableCell>
                    <span className="rounded-md border border-[#e4e4e7] bg-[#fafafa] px-2 py-1 text-xs text-[#71717a]">
                      localStorage
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEditPage(page.id)}
                        className="rounded-md border border-[#e4e4e7] bg-white px-3 py-2 text-sm text-[#18181b] transition hover:bg-[#fafafa]"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeletePage(page.id)}
                        className="rounded-md border border-[#e4e4e7] bg-white px-3 py-2 text-sm text-[#71717a] transition hover:bg-[#fafafa]"
                      >
                        删除
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="font-medium text-[#09090b]">
                  共 {pages.length} 个已保存页面
                </TableCell>
                <TableCell className="text-right text-[#71717a]">
                  浏览器存储
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </section>
  )
}

function EditorPage({
  currentPage,
  editorState,
  imageSourceName,
  isGeneratingFromImage,
  isMissingPage,
  isSaving,
  onBack,
  onChange,
  onDelete,
  onGenerateFromImage,
  onSave,
}: EditorPageProps) {
  const deferredMarkdown = useDeferredValue(editorState.markdown)
  const isDirty = currentPage
    ? currentPage.title !== editorState.title || currentPage.markdown !== editorState.markdown
    : false

  if (isMissingPage) {
    return (
      <section className="space-y-6">
        <div className="rounded-xl border border-dashed border-[#d4d4d8] bg-white px-5 py-10">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-[#71717a]">
            Missing Page
          </p>
          <h2 className="m-0 text-2xl tracking-[-0.03em] text-[#09090b]">
            这个已保存页面不存在
          </h2>
          <p className="mb-0 mt-3 max-w-[560px] text-sm leading-6 text-[#52525b]">
            它可能已经被删除，或者当前浏览器存储已经清空。你可以先回到列表页，再重新创建一个页面。
          </p>
          <button
            type="button"
            onClick={onBack}
            className="mt-6 rounded-md bg-[#18181b] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black"
          >
            返回列表页
          </button>
        </div>
      </section>
    )
  }

  if (!currentPage)
    return null

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-5 border-b border-[#e4e4e7] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-4 rounded-md border border-[#e4e4e7] bg-white px-3 py-2 text-sm text-[#3f3f46] transition hover:bg-[#fafafa]"
          >
            返回列表页
          </button>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-[#71717a]">
            Editor Page
          </p>
          <h2 className="m-0 text-[2.25rem] leading-[0.95] tracking-[-0.04em] text-[#09090b]">
            {currentPage.title}
          </h2>
          <p className="mb-0 mt-3 text-sm leading-6 text-[#52525b]">
            最近更新于 {formatTimestamp(currentPage.updatedAt)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span
            className={cn(
              'rounded-md border px-3 py-2 text-sm',
              isDirty
                ? 'border-[#e4e4e7] bg-[#fafafa] text-[#18181b]'
                : 'border-[#e4e4e7] bg-white text-[#71717a]',
            )}
          >
            {isDirty ? '未保存改动' : '已同步'}
          </span>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || isGeneratingFromImage}
            className="rounded-md bg-[#18181b] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? '保存中...' : '保存修改'}
          </button>
          <button
            type="button"
            onClick={() => onDelete(currentPage.id)}
            className="rounded-md border border-[#e4e4e7] bg-white px-4 py-2.5 text-sm text-[#71717a] transition hover:bg-[#fafafa]"
          >
            删除页面
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[260px_minmax(320px,1fr)_minmax(320px,1fr)]">
        <aside className="space-y-5 rounded-xl border border-[#e4e4e7] bg-white p-5">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-[#71717a]">
              Page Meta
            </p>
            <h3 className="m-0 text-[1.25rem] tracking-[-0.03em] text-[#09090b]">
              页面设置
            </h3>
          </div>

          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-[#71717a]">
              页面标题
            </span>
            <input
              value={editorState.title}
              onChange={event => onChange({ ...editorState, title: event.target.value })}
              className="w-full rounded-lg border border-[#e4e4e7] bg-white px-3 py-2.5 text-sm text-[#09090b] outline-none transition focus:border-[#18181b]"
            />
          </label>

          <div className="space-y-4 rounded-lg border border-[#e4e4e7] bg-[#fafafa] p-4 text-sm text-[#52525b]">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-[#71717a]">
                保存目标
              </p>
              <p className="m-0">浏览器 localStorage</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-[#71717a]">
                创建时间
              </p>
              <p className="m-0">{formatTimestamp(currentPage.createdAt)}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-[#71717a]">
                最近更新
              </p>
              <p className="m-0">{formatTimestamp(currentPage.updatedAt)}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-[#71717a]">
                图片转 Markdown
              </p>
              <p className="m-0">
                {imageSourceName ? `最近一次来源: ${imageSourceName}` : '尚未上传图片'}
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-[#e4e4e7] bg-white p-4">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-[#71717a]">
                AI Generation
              </p>
              <p className="m-0 text-sm leading-6 text-[#52525b]">
                上传一张图片，Gemini 会生成与图片内容一致的 Markdown。自定义组件只允许使用
                {' '}
                <code>withIconCardList</code>
                {' '}
                和
                {' '}
                <code>withIconCardItem</code>
                。
              </p>
            </div>
            <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-[#e4e4e7] bg-white px-3 py-2 text-sm text-[#18181b] transition hover:bg-[#fafafa]">
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
              {isGeneratingFromImage ? '生成中...' : '上传图片并生成 Markdown'}
            </label>
            <p className="m-0 text-xs leading-5 text-[#71717a]">
              建议上传 5MB 以内的 PNG、JPG、WEBP 等常见图片格式。生成结果会先覆盖到当前编辑区，确认后再手动保存。
            </p>
          </div>
        </aside>

        <div className="flex min-h-[560px] flex-col overflow-hidden rounded-xl border border-[#e4e4e7] bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-[#e4e4e7] px-5 py-4">
            <h3 className="m-0 text-sm font-medium text-[#09090b]">Input</h3>
            <span className="text-sm text-[#71717a]">Markdown / directive</span>
          </div>
          <textarea
            className="min-h-0 flex-1 resize-none border-0 bg-white px-5 py-5 font-['IBM_Plex_Mono','SFMono-Regular',Consolas,monospace] text-[0.95rem] leading-7 text-[#18181b] outline-none"
            value={editorState.markdown}
            onChange={event => onChange({ ...editorState, markdown: event.target.value })}
            spellCheck={false}
            aria-label="Markdown input"
          />
        </div>

        <div className="flex min-h-[560px] flex-col overflow-hidden rounded-xl border border-[#e4e4e7] bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-[#e4e4e7] px-5 py-4">
            <h3 className="m-0 text-sm font-medium text-[#09090b]">Preview</h3>
            <span className="text-sm text-[#71717a]">Rendered output</span>
          </div>
          <div className="flex-1 overflow-auto px-5 py-5">
            <MarkdownWithDirective markdown={deferredMarkdown} className={previewClassName} />
          </div>
        </div>
      </div>
    </section>
  )
}

function App() {
  const [repository] = useState(() => new BrowserSavedPageRepository(window.localStorage))
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash))
  const [pages, setPages] = useState<SavedPage[]>([])
  const [editorState, setEditorState] = useState<EditorState>(blankEditorState)
  const [createDraft, setCreateDraft] = useState<CreatePageDraft>(blankCreateDraft)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isGeneratingFromImage, setIsGeneratingFromImage] = useState(false)
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
  }, [route, currentPage])

  useEffect(() => {
    if (route.name === 'editor')
      setIsCreateModalOpen(false)
  }, [route])

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

  async function handleDelete(id: string) {
    const target = pages.find(page => page.id === id)
    if (!target)
      return

    if (!window.confirm(`确认删除「${target.title}」吗？`))
      return

    await repository.delete(id)
    await refreshPages()
    setFeedback('页面已删除。')

    if (route.name === 'editor' && route.pageId === id)
      navigate({ name: 'library' })
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
      setIsCreateModalOpen(false)
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
      setImageSourceName(file.name)
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
    <div className="min-h-screen bg-[#fafafa] text-[#09090b] lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="hidden border-r border-[#e4e4e7] bg-[#fcfcfc] lg:flex lg:min-h-screen lg:flex-col">
        <div className="border-b border-[#e4e4e7] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full border border-[#18181b] bg-[#18181b]" />
            <div>
              <p className="m-0 text-lg font-semibold tracking-[-0.03em] text-[#09090b]">
                static-ui-builder
              </p>
              <p className="m-0 text-sm text-[#71717a]">
                markdown studio
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 py-5">
          <div className="space-y-1">
            <p className="px-3 pb-2 text-xs font-medium uppercase tracking-[0.18em] text-[#71717a]">
              Navigation
            </p>
            <button
              type="button"
              onClick={() => navigate({ name: 'library' })}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition',
                route.name === 'library'
                  ? 'bg-[#f4f4f5] font-medium text-[#09090b]'
                  : 'text-[#52525b] hover:bg-[#f4f4f5]',
              )}
            >
              <span>列表页</span>
              <span className="text-xs text-[#a1a1aa]">{pages.length}</span>
            </button>
            <button
              type="button"
              onClick={() => route.name === 'editor' && currentPage ? navigate(route) : navigate({ name: 'library' })}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition',
                route.name === 'editor'
                  ? 'bg-[#f4f4f5] font-medium text-[#09090b]'
                  : 'text-[#52525b] hover:bg-[#f4f4f5]',
              )}
            >
              <span>编辑页</span>
              <span className="truncate pl-3 text-xs text-[#a1a1aa]">
                {route.name === 'editor' && currentPage ? currentPage.title : '未打开'}
              </span>
            </button>
          </div>

          <div className="mt-8 space-y-3 rounded-xl border border-[#e4e4e7] bg-white p-4">
            <p className="m-0 text-xs font-medium uppercase tracking-[0.18em] text-[#71717a]">
              Storage
            </p>
            <p className="m-0 text-sm text-[#09090b]">
              浏览器 localStorage
            </p>
            <p className="m-0 text-sm text-[#71717a]">
              当前保存了 {pages.length} 个页面。后续替换成接口层时，可以继续复用当前 UI。
            </p>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="border-b border-[#e4e4e7] bg-white">
          <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-[#71717a]">
                Static UI Builder
              </p>
              <h1 className="m-0 text-xl font-semibold tracking-[-0.03em] text-[#09090b]">
                {route.name === 'library' ? '内容列表' : '内容编辑'}
              </h1>
            </div>
            <div className="hidden text-sm text-[#71717a] md:block">
              {route.name === 'library' ? '清爽、简洁的文档式管理界面' : '专注编辑与预览的双栏工作区'}
            </div>
          </div>
        </div>

        <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
          {feedback && (
            <section className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-[#e4e4e7] bg-white px-4 py-3 text-sm text-[#3f3f46]">
              <span>{feedback}</span>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="rounded-md border border-[#e4e4e7] bg-white px-3 py-1.5 text-sm text-[#52525b] transition hover:bg-[#fafafa]"
              >
                关闭
              </button>
            </section>
          )}

          {route.name === 'library'
            ? (
                <LibraryPage
                  isCreating={isCreating}
                  isLoading={isLoading}
                  onCreateClick={() => setIsCreateModalOpen(true)}
                  onDeletePage={handleDelete}
                  onEditPage={pageId => navigate({ name: 'editor', pageId })}
                  pages={pages}
                />
              )
            : (
                <EditorPage
                  currentPage={currentPage}
                  editorState={editorState}
                  imageSourceName={imageSourceName}
                  isGeneratingFromImage={isGeneratingFromImage}
                  isMissingPage={isMissingPage}
                  isSaving={isSaving}
                  onBack={() => navigate({ name: 'library' })}
                  onChange={setEditorState}
                  onDelete={handleDelete}
                  onGenerateFromImage={handleGenerateFromImage}
                  onSave={handleSave}
                />
              )}
        </main>
      </div>

      <CreatePageModal
        draft={createDraft}
        isOpen={isCreateModalOpen}
        isSubmitting={isCreating}
        onChange={setCreateDraft}
        onClose={() => {
          setIsCreateModalOpen(false)
          setCreateDraft(blankCreateDraft)
        }}
        onSubmit={handleCreatePage}
      />
    </div>
  )
}

export default App
