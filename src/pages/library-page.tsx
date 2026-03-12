import { useNavigate } from '@tanstack/react-router'
import { FilePenLine, Plus, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { useAppState } from '../app/context'
import { PageHeading } from '../app/ui'
import { describePreview, formatTimestamp } from '../app/utils'

export function LibraryPage() {
  const navigate = useNavigate()
  const { isCreating, isLoading, openCreateDialog, pages, setDeleteTarget } = useAppState()

  return (
    <section className="space-y-6">
      <PageHeading
        eyebrow="Content Library"
        title="Pages"
        description="Manage local Markdown pages with the shadcn-admin card and table system."
        actions={(
          <Button onClick={openCreateDialog} disabled={isCreating}>
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
                <Button className="mt-4" onClick={openCreateDialog}>
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
                          <Button
                            variant="outline"
                            onClick={() => navigate({ to: '/editor/$pageId', params: { pageId: page.id } })}
                          >
                            <FilePenLine className="size-4" />
                            Edit
                          </Button>
                          <Button variant="ghost" onClick={() => setDeleteTarget(page)}>
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
