import type { ReactNode } from 'react'
import type { WithIconCardListProps } from './markdown-with-directive-schema'
import { cn } from '../../../utils/classnames'

type WithIconListProps = WithIconCardListProps & {
  children?: ReactNode
}

function WithIconCardList({ children, className }: WithIconListProps) {
  return (
    <div className={cn('my-4 grid gap-2', className)}>
      {children}
    </div>
  )
}

export default WithIconCardList
