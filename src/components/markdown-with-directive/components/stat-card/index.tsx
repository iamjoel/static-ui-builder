import type { ReactNode } from 'react'
import { cn } from '../../../../utils/classnames'

export type StatCardProps = {
  children?: ReactNode
  className?: string
  hint?: string
  label?: string
  trend?: 'down' | 'neutral' | 'up'
  value?: string
}

const trendMeta: Record<NonNullable<StatCardProps['trend']>, { color: string, label: string, symbol: string }> = {
  up: {
    color: 'text-emerald-600',
    label: 'Up',
    symbol: '↗',
  },
  down: {
    color: 'text-rose-600',
    label: 'Down',
    symbol: '↘',
  },
  neutral: {
    color: 'text-slate-500',
    label: 'Stable',
    symbol: '→',
  },
}

function StatCard({ children, className, hint, label, trend = 'neutral', value }: StatCardProps) {
  const trendInfo = trendMeta[trend]

  return (
    <div className={cn('rounded-2xl border bg-card px-4 py-4 shadow-xs', className)}>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            {label && <p className="text-sm font-medium text-muted-foreground">{label}</p>}
            {value && <p className="text-3xl font-semibold tracking-tight">{value}</p>}
          </div>
          <span className={cn('inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium', trendInfo.color)}>
            <span aria-hidden="true">{trendInfo.symbol}</span>
            {trendInfo.label}
          </span>
        </div>
        {hint && <p className="text-sm leading-6 text-muted-foreground">{hint}</p>}
        {children && <div className="text-sm leading-6 text-muted-foreground [&_p:last-child]:mb-0">{children}</div>}
      </div>
    </div>
  )
}

export default StatCard
