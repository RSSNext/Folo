import { cn } from "@follow/utils/utils"
import { useSetAtom } from "jotai"
import type { FC } from "react"
import { use } from "react"

import { EntryContentPlaceholderContext } from "~/modules/app-layout/entry-content/EntryContentPlaceholderContext"

import { DayOf } from "./constants"
import { DailyReportTitle } from "./daily"
import type { DailyItemProps, DailyView } from "./types"
import { useParseDailyDate } from "./useParseDailyDate"

export const EntryPlaceholderDaily = ({
  view,
  className,
}: {
  view: DailyView
  className?: string
}) => (
  <div className={cn(className, "mx-auto flex w-full max-w-[75ch] flex-col gap-6")}>
    <NormalDailyReportTitle day={DayOf.Today} view={view} />
    <NormalDailyReportTitle day={DayOf.Yesterday} view={view} />
  </div>
)

const NormalDailyReportTitle: FC<DailyItemProps> = ({ day }) => {
  const { title, startDate, endDate } = useParseDailyDate(day)

  const setOpenedSummary = useSetAtom(use(EntryContentPlaceholderContext).openedSummary)

  return (
    <button
      type="button"
      onClick={() => {
        setOpenedSummary(day)
      }}
      className="border-b last:border-b-0"
    >
      <DailyReportTitle title={title} startDate={startDate} endDate={endDate} />
    </button>
  )
}
