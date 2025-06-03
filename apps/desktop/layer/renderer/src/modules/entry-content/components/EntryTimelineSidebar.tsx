import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/EllipsisWithTooltip.js"
import { cn } from "@follow/utils/utils"
import type { Target, TargetAndTransition } from "motion/react"
import { m } from "motion/react"

import { useIsZenMode } from "~/atoms/settings/ui"
import { useEntryIsRead } from "~/hooks/biz/useAsRead"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { useGetEntryIdInRange } from "~/modules/entry-column/hooks/useEntryIdListSnap"
import { useEntry } from "~/store/entry"

export const EntryTimelineSidebar = ({ entryId }: { entryId: string }) => {
  const isZenMode = useIsZenMode()

  if (!isZenMode) {
    return null
  }

  return <Timeline entryId={entryId} />
}

const Timeline = ({ entryId }: { entryId: string }) => {
  const entryIds = useGetEntryIdInRange(entryId, [5, 5])

  return (
    <m.div
      className="@lg:max-w-0 @6xl:max-w-[200px] @7xl:max-w-[200px] @[90rem]:max-w-[250px] absolute left-8 top-28 z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { delay: 0.5 } }}
    >
      {entryIds.map((id) => (
        <TimelineItem key={id} id={id} />
      ))}
    </m.div>
  )
}

const initialButton: Target = {
  opacity: 0.0001,
}
const animateButton: TargetAndTransition = {
  opacity: 1,
}

const TimelineItem = ({ id }: { id: string }) => {
  const entry = useEntry(id, (e) => ({
    title: e.entries.title,
    read: e.read,
  }))
  const asRead = useEntryIsRead(entry)
  const navigate = useNavigateEntry()

  const isActive = useRouteParamsSelector((r) => r.entryId === id)

  return (
    <m.button
      layoutId={`timeline-${id}`}
      initial={initialButton}
      animate={animateButton}
      className={"relative block min-w-0 max-w-full cursor-pointer text-xs leading-loose"}
      type="button"
      onClick={() => navigate({ entryId: id })}
    >
      {!asRead && (
        <span className="bg-accent absolute -left-4 top-1/2 size-1.5 -translate-y-1/2 rounded-full opacity-50" />
      )}
      <EllipsisHorizontalTextWithTooltip
        className={cn(
          "truncate transition-[opacity,font-weight] duration-200",
          isActive ? "font-medium opacity-100" : "opacity-60 hover:opacity-80",
        )}
      >
        {entry?.title}
      </EllipsisHorizontalTextWithTooltip>
    </m.button>
  )
}
