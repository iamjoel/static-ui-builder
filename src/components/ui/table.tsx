import type { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '../../utils/classnames'

type TableCaptionProps = HTMLAttributes<HTMLTableCaptionElement>
type TableCellProps = TdHTMLAttributes<HTMLTableCellElement>
type TableHeadProps = ThHTMLAttributes<HTMLTableCellElement>
type TableRowProps = HTMLAttributes<HTMLTableRowElement>
type TableSectionProps = HTMLAttributes<HTMLTableSectionElement>

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-x-auto">
      <table
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  )
}

export function TableHeader({ className, ...props }: TableSectionProps) {
  return (
    <thead
      className={cn('[&_tr]:border-b', className)}
      {...props}
    />
  )
}

export function TableBody({ className, ...props }: TableSectionProps) {
  return (
    <tbody
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  )
}

export function TableFooter({ className, ...props }: TableSectionProps) {
  return (
    <tfoot
      className={cn('border-t bg-[#fafafa] font-medium [&>tr]:last:border-b-0', className)}
      {...props}
    />
  )
}

export function TableRow({ className, ...props }: TableRowProps) {
  return (
    <tr
      className={cn('border-b border-[#e4e4e7] transition-colors hover:bg-[#fafafa]', className)}
      {...props}
    />
  )
}

export function TableHead({ className, ...props }: TableHeadProps) {
  return (
    <th
      className={cn('h-12 px-4 text-left align-middle text-xs font-medium uppercase tracking-[0.16em] text-[#71717a]', className)}
      {...props}
    />
  )
}

export function TableCell({ className, ...props }: TableCellProps) {
  return (
    <td
      className={cn('align-middle px-4 py-4 text-sm text-[#3f3f46]', className)}
      {...props}
    />
  )
}

export function TableCaption({ className, ...props }: TableCaptionProps) {
  return (
    <caption
      className={cn('mt-4 text-sm text-[#71717a]', className)}
      {...props}
    />
  )
}
