type DirectiveIconProps = {
  className?: string
  icon?: string
}

function isRemoteImage(icon: string) {
  return /^https?:\/\//i.test(icon)
}

export function DirectiveIcon({ className, icon }: DirectiveIconProps) {
  if (!icon)
    return null

  if (isRemoteImage(icon)) {
    return (
      <img
        src={icon}
        alt=""
        aria-hidden="true"
        className={className}
        width={40}
        height={40}
      />
    )
  }

  return (
    <span aria-hidden="true" className={className}>
      {icon}
    </span>
  )
}
