import type { ReactNode } from 'react'
import type { WithIconCardItemProps } from '../markdown-with-directive-schema'
import { cn } from '../../../../utils/classnames'

type WithIconItemProps = WithIconCardItemProps & {
  children?: ReactNode
  iconAlt?: string
}

function WithIconCardItem({ icon, children, className, iconAlt }: WithIconItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-[#e4e4e7] bg-white px-3 py-3",
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
      <div className="min-w-0 text-[#3f3f46] [&_p]:m-0">
        {children}
      </div>
    </div>
  )
}

export default WithIconCardItem
