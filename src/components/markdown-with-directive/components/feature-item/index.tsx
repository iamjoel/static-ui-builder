import type { ReactNode } from 'react'
import { DirectiveIcon } from '../directive-icon'
import { cn } from '../../../../utils/classnames'

export type FeatureItemProps = {
  children?: ReactNode
  className?: string
  icon?: string
  title?: string
}

function FeatureItem({ children, className, icon, title }: FeatureItemProps) {
  return (
    <div className={cn('rounded-2xl border bg-card px-4 py-4 shadow-xs', className)}>
      <div className="space-y-3">
        {(icon || title) && (
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-lg text-primary">
              <DirectiveIcon icon={icon} className="size-5 object-contain" />
            </div>
            {title && <p className="text-base font-semibold tracking-tight">{title}</p>}
          </div>
        )}
        <div className="text-sm leading-6 text-muted-foreground [&_p:last-child]:mb-0">
          {children}
        </div>
      </div>
    </div>
  )
}

export default FeatureItem
