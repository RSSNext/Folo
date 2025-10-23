import { cn } from "@follow/utils/utils"

import { getLevelMultiplier } from "~/lib/utils"

export const Level = ({
  level,
  isLoading,
  hideIcon,
  className,
}: {
  level: number
  isLoading?: boolean
  hideIcon?: boolean
  className?: string
}) => {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {!hideIcon && <i className="i-mgc-vip-2-cute-fi text-accent" />}
      {isLoading ? (
        <span className="h-3 w-8 animate-pulse rounded-xl bg-theme-inactive" />
      ) : (
        <>
          <span className="tabular-nums">Lv.{level}</span>
          <sub className="-translate-y-px text-[0.6rem] font-normal">
            {getLevelMultiplier(level)}x
          </sub>
        </>
      )}
    </div>
  )
}
