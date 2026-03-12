import type { ReactNode } from 'react'
import { DirectiveIcon } from '../directive-icon'
import { cn } from '../../../../utils/classnames'

export type CalloutProps = {
  children?: ReactNode
  className?: string
  icon?: string
  title?: string
  tone?: 'error' | 'info' | 'success' | 'warning'
}

const toneClassNames: Record<NonNullable<CalloutProps['tone']>, string> = {
  info: 'border-sky-200 bg-sky-50 text-sky-950',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
  error: 'border-rose-200 bg-rose-50 text-rose-950',
}

function Callout({ children, className, icon, title, tone = 'info' }: CalloutProps) {
  return (
    <div className={cn('my-4 rounded-2xl border px-4 py-4 shadow-xs', toneClassNames[tone], className)}>
      <div className="flex gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-lg shadow-xs">
          <DirectiveIcon icon={icon} className="size-6 object-contain" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          {title && <p className="text-sm font-semibold tracking-tight">{title}</p>}
          <div className="text-sm leading-6 [&_p:last-child]:mb-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Callout
