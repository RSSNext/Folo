import { cn } from "@follow/utils/utils"
import { useState } from "react"

import { useI18n } from "~/hooks/common"

export const BoostProgress = ({
  level,
  boostCount,
  remainingBoostsToLevelUp,
  lastValidBoost,
}: {
  level: number
  boostCount: number
  remainingBoostsToLevelUp: number
  lastValidBoost: {
    hash: string | null
    expiresAt: string
  } | null
}) => {
  const [numberFormater] = useState(() => new Intl.NumberFormat())
  const t = useI18n()
  const rawPercentage = (boostCount / (boostCount + remainingBoostsToLevelUp)) * 100
  const percentage = Math.max(rawPercentage, 2)
  const nextLevel = level + 1
  return (
    <div className="flex w-full flex-col px-2">
      <div className="relative -mx-1 pt-12">
        <span
          className={cn(
            "absolute -bottom-3 mb-10 flex h-7 -translate-x-1/2 items-center justify-center whitespace-nowrap rounded-full p-2 text-sm font-bold text-white transition-all duration-500 ease-out after:absolute after:bottom-[-5px] after:left-1/2 after:-z-10 after:flex after:size-3 after:-translate-x-1/2 after:rotate-45",
            "bg-orange-500 after:bg-orange-500",
            "motion-preset-shake",
          )}
          style={{ left: `${percentage}%` }}
        >
          <i className="i-mgc-train-cute-fi mr-2 shrink-0" />
          {numberFormater.format(boostCount)}
        </span>
        <div className="relative flex h-3 w-full overflow-hidden rounded-3xl bg-gray-200 dark:bg-zinc-800">
          <div
            role="progressbar"
            aria-valuenow={boostCount}
            aria-valuemin={0}
            aria-valuemax={remainingBoostsToLevelUp}
            style={{ width: `calc(${percentage}% + 0.5rem)` }}
            className="bg-accent flex h-full -translate-x-1 items-center justify-center rounded-3xl text-white transition-all duration-500 ease-out"
          />
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-accent text-lg font-bold">Lv. {level}</span>
        <span className="text-accent text-lg font-bold">Lv. {nextLevel}</span>
      </div>
      <small className="center mt-2 gap-1">
        {t("boost.remaining_boosts_to_level_up", {
          remainingBoostsToLevelUp: numberFormater.format(remainingBoostsToLevelUp),
        })}
      </small>
      {lastValidBoost && (
        <small className="center mt-1 gap-1">
          {t("boost.expired_description", {
            expiredDate: new Date(lastValidBoost.expiresAt),
            interpolation: { escapeValue: false },
          })}
        </small>
      )}
    </div>
  )
}
