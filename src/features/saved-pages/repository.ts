import { z } from 'zod'

const STORAGE_KEY = 'static-ui-builder.saved-pages.v1'

export const savedPageSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  markdown: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

const savedPagesEnvelopeSchema = z.object({
  version: z.literal(1),
  pages: z.array(savedPageSchema),
})

export type SavedPage = z.infer<typeof savedPageSchema>

export type SavedPageInput = {
  markdown: string
  title: string
}

export interface SavedPageRepository {
  create(input: SavedPageInput): Promise<SavedPage>
  delete(id: string): Promise<void>
  get(id: string): Promise<SavedPage | null>
  list(): Promise<SavedPage[]>
  update(id: string, input: SavedPageInput): Promise<SavedPage>
}

function sortPages(pages: SavedPage[]) {
  return [...pages].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  )
}

function readEnvelope(storage: Storage): z.infer<typeof savedPagesEnvelopeSchema> {
  const raw = storage.getItem(STORAGE_KEY)
  if (!raw)
    return { version: 1, pages: [] }

  try {
    const parsed = savedPagesEnvelopeSchema.safeParse(JSON.parse(raw))
    if (parsed.success)
      return parsed.data
  }
  catch {
    // Fall through to reset corrupted storage.
  }

  return { version: 1, pages: [] }
}

function writeEnvelope(storage: Storage, pages: SavedPage[]) {
  storage.setItem(STORAGE_KEY, JSON.stringify({
    version: 1,
    pages,
  }))
}

export class BrowserSavedPageRepository implements SavedPageRepository {
  private readonly storage: Storage

  constructor(storage: Storage) {
    this.storage = storage
  }

  async list() {
    return sortPages(readEnvelope(this.storage).pages)
  }

  async get(id: string) {
    const page = readEnvelope(this.storage).pages.find(candidate => candidate.id === id)
    return page ?? null
  }

  async create(input: SavedPageInput) {
    const envelope = readEnvelope(this.storage)
    const now = new Date().toISOString()
    const page: SavedPage = {
      id: crypto.randomUUID(),
      title: input.title,
      markdown: input.markdown,
      createdAt: now,
      updatedAt: now,
    }

    writeEnvelope(this.storage, sortPages([page, ...envelope.pages]))
    return page
  }

  async update(id: string, input: SavedPageInput) {
    const envelope = readEnvelope(this.storage)
    const target = envelope.pages.find(page => page.id === id)

    if (!target)
      throw new Error(`Saved page not found: ${id}`)

    const nextPage: SavedPage = {
      ...target,
      title: input.title,
      markdown: input.markdown,
      updatedAt: new Date().toISOString(),
    }

    const nextPages = envelope.pages.map(page => page.id === id ? nextPage : page)
    writeEnvelope(this.storage, sortPages(nextPages))
    return nextPage
  }

  async delete(id: string) {
    const envelope = readEnvelope(this.storage)
    writeEnvelope(
      this.storage,
      envelope.pages.filter(page => page.id !== id),
    )
  }
}
