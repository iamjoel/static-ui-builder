import type { ReactNode } from 'react'
import { FilePenLine, Layers3, Plus, Sparkles } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { cn } from '../lib/utils'
import type { CreatePageDialogProps, DeletePageDialogProps, PageMetaDraft, ToastState } from './types'

export function AppBrand() {
  return (
    <div className="flex items-center gap-2 px-2">
      <Layers3 className="size-5" />
      <p className="text-lg font-semibold tracking-tight">Static UI Builder</p>
    </div>
  )
}

export function PageHeading({
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

export function ToastNotice({
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

export function EditPageInfoDialog({
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

export function CreatePageDialog({
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

export function DeletePageDialog({
  isDeleting,
  page,
  onClose,
  onConfirm,
}: DeletePageDialogProps) {
  return (
    <AlertDialog open={Boolean(page)} onOpenChange={open => !open && onClose()}>
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
