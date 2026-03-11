import type { ReactNode } from 'react'
import type { WithIconCardItemProps } from './markdown-with-directive-schema'
import { cn } from '../../../utils/classnames'

type WithIconItemProps = WithIconCardItemProps & {
  children?: ReactNode
  iconAlt?: string
}

function WithIconCardItem({ icon, children, className, iconAlt }: WithIconItemProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl border border-[rgba(23,32,51,0.08)] bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fd_100%)] px-3 py-[10px] shadow-[0_10px_30px_rgba(35,46,72,0.08)]',
        className,
      )}
    >
      <img
        src={icon}
        className="h-10 w-10 shrink-0 object-contain"
        alt={iconAlt ?? ''}
        aria-hidden={iconAlt ? undefined : true}
        width={40}
        height={40}
      />
      <div className="min-w-0 text-[#42506b] [&_p]:m-0">
        {children}
      </div>
    </div>
  )
}

export default WithIconCardItem
