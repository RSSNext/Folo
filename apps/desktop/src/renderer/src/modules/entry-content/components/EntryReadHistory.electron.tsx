import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import {
  HoverCard,
  HoverCardContent,
  HoverCardPortal,
  HoverCardTrigger,
} from "@radix-ui/react-hover-card"
import clsx from "clsx"

import { useWhoami } from "~/atoms/user"
import { useAuthQuery } from "~/hooks/common"
import { useAppLayoutGridContainerWidth } from "~/providers/app-grid-layout-container-provider"
import { Queries } from "~/queries"
import { useEntryReadHistory } from "~/store/entry"

import { EntryUser, EntryUserRow, getLimit } from "./EntryReadHistory.shared"

export const EntryReadHistory: Component<{ entryId: string }> = ({ entryId }) => {
  const me = useWhoami()
  const entryHistory = useEntryReadHistory(entryId)

  const { data } = useAuthQuery(Queries.entries.entryReadingHistory(entryId), {
    refetchInterval: 1000 * 60,
  })
  const totalCount = data?.total || 0

  const appGirdContainerWidth = useAppLayoutGridContainerWidth()

  const LIMIT = getLimit(appGirdContainerWidth)

  if (!entryHistory) return null
  if (!me) return null
  if (!entryHistory.userIds) return null

  return (
    <div
      className="animate-in fade-in @md:flex hidden items-center duration-200"
      data-hide-in-print
    >
      {entryHistory.userIds
        .filter((id) => id !== me?.id)
        .slice(0, LIMIT)

        .map((userId, i) => (
          <EntryUser userId={userId} i={i} key={userId} />
        ))}

      {!!totalCount && totalCount > LIMIT && (
        <HoverCard>
          <HoverCardTrigger asChild>
            <button
              type="button"
              style={{
                marginLeft: `-${LIMIT * 8}px`,
                zIndex: LIMIT + 1,
              }}
              className="no-drag-region border-border bg-material-medium ring-background relative flex size-7 items-center justify-center rounded-full border ring-2"
            >
              <span className="text-text-secondary text-[10px] font-medium tabular-nums">
                +{Math.min(totalCount - LIMIT, 99)}
              </span>
            </button>
          </HoverCardTrigger>

          {totalCount > LIMIT && (
            <HoverCardPortal>
              <HoverCardContent
                sideOffset={12}
                align="start"
                side="right"
                className={clsx(
                  "bg-background z-10 rounded-md border drop-shadow",
                  "data-[state=open]:animate-in data-[state=closed]:animate-out",
                  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                  "data-[state=closed]:slide-out-to-left-5 data-[state=open]:slide-in-from-left-5",
                  "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                  "transition-all duration-200 ease-in-out",
                )}
              >
                <ScrollArea.ScrollArea
                  rootClassName="max-h-[300px] max-w-[20ch] flex flex-col"
                  flex
                >
                  <ul>
                    {entryHistory.userIds
                      .filter((id) => id !== me?.id)
                      .slice(LIMIT)
                      .map((userId) => (
                        <EntryUserRow userId={userId} key={userId} />
                      ))}
                  </ul>
                </ScrollArea.ScrollArea>
              </HoverCardContent>
            </HoverCardPortal>
          )}
        </HoverCard>
      )}
    </div>
  )
}
