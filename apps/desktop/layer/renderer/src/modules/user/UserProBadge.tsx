import { UserRole, UserRoleName } from "@follow/constants"
import { cn } from "@follow/utils"

export const UserProBadge = ({
  className,
  withText,
  iconClassName,
  role,
  onClick,
}: {
  className?: string
  withText?: boolean
  iconClassName?: string
  role?: UserRole | null
  onClick?: () => void
}) => {
  if (!role) {
    return null
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1",
        role === UserRole.Trial || role === UserRole.Free ? "text-text-secondary" : "text-accent",
        className,
      )}
      onClick={onClick}
    >
      <i className={cn("i-mgc-power block", iconClassName)} />
      {withText && <span className="text-xs">{UserRoleName[role]}</span>}
    </div>
  )
}
