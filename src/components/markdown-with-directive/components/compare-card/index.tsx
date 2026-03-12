import type { ReactNode } from 'react'
import { cn } from '../../../../utils/classnames'

export type CompareCardProps = {
  badge?: string
  children?: ReactNode
  className?: string
  highlight?: 'false' | 'true'
  title?: string
}

function CompareCard({ badge, children, className, highlight = 'false', title }: CompareCardProps) {
  const isHighlighted = highlight === 'true'

  return (
    <div
      className={cn(
        'rounded-2xl border bg-card px-5 py-5 shadow-xs',
        isHighlighted && 'border-primary/30 bg-primary/5 shadow-sm',
        className,
      )}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          {badge && (
            <span className={cn(
              'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
              isHighlighted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
            )}
            >
              {badge}
            </span>
          )}
          {title && <p className="text-lg font-semibold tracking-tight">{title}</p>}
        </div>
        <div className="text-sm leading-6 text-muted-foreground [&_li+li]:mt-1.5 [&_p:last-child]:mb-0 [&_ul]:pl-5">
          {children}
        </div>
      </div>
    </div>
  )
}

export default CompareCard
