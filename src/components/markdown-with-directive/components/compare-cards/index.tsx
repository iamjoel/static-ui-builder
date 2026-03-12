import type { ReactNode } from 'react'
import { cn } from '../../../../utils/classnames'

export type CompareCardsProps = {
  children?: ReactNode
  className?: string
  columns?: '2' | '3'
}

const columnsClassNames: Record<NonNullable<CompareCardsProps['columns']>, string> = {
  '2': 'md:grid-cols-2',
  '3': 'md:grid-cols-2 xl:grid-cols-3',
}

function CompareCards({ children, className, columns = '2' }: CompareCardsProps) {
  return (
    <div className={cn('my-5 grid gap-4', columnsClassNames[columns], className)}>
      {children}
    </div>
  )
}

export default CompareCards
