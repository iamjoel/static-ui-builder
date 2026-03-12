import type { ReactNode } from 'react'
import { cn } from '../../../../utils/classnames'

export type FeatureGridProps = {
  children?: ReactNode
  className?: string
  columns?: '2' | '3' | '4'
}

const columnsClassNames: Record<NonNullable<FeatureGridProps['columns']>, string> = {
  '2': 'md:grid-cols-2',
  '3': 'md:grid-cols-2 xl:grid-cols-3',
  '4': 'md:grid-cols-2 xl:grid-cols-4',
}

function FeatureGrid({ children, className, columns = '3' }: FeatureGridProps) {
  return (
    <div className={cn('my-5 grid gap-4', columnsClassNames[columns], className)}>
      {children}
    </div>
  )
}

export default FeatureGrid
