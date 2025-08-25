import { Button } from "@follow/components/ui/button/index.js"
import { cn } from "@follow/utils"
import { memo } from "react"
import { useTranslation } from "react-i18next"

import { m } from "~/components/common/Motion"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { ScrollToExitTutorial } from "~/modules/entry-column/components/ScrollToExitTutorial"
import { useEntryContentScrollToTop } from "~/modules/entry-content/atoms"

import { EntryHeaderRoot } from "./internal/context"
import { EntryHeaderActionsContainer } from "./internal/EntryHeaderActionsContainer"
import { EntryHeaderMeta } from "./internal/EntryHeaderMeta"
import { EntryHeaderReadHistory } from "./internal/EntryHeaderReadHistory"
import type { EntryHeaderProps } from "./types"

function EntryHeaderImpl({ entryId, className, compact }: EntryHeaderProps) {
  const { t } = useTranslation()
  const navigate = useNavigateEntry()
  const isAtTop = !!useEntryContentScrollToTop()

  return (
    <>
      <EntryHeaderRoot
        entryId={entryId}
        className={cn(
          className,
          "@container bg-background z-10 h-[95px] shrink-0 flex-col gap-0 px-3",
        )}
        compact={compact}
        style={{
          y: isAtTop ? 0 : -40,
        }}
      >
        {/* Scroll to exit hint - integrated into header to maintain consistent height */}
        <m.div
          className="z-50 flex h-10 items-center justify-center"
          style={{
            opacity: isAtTop ? 1 : 0,
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ entryId: null })}
            buttonClassName="h-full cursor-pointer select-none no-drag-region rounded-none px-6"
            aria-label="Scroll up or click to exit"
          >
            <div className="text-text flex items-center gap-2 rounded-full font-medium">
              <i className="i-mgc-up-cute-re repeat-[2] text-base" />
              <span>{t("entry.scroll_up_to_exit")}</span>
            </div>
          </Button>
        </m.div>

        <div className={cn("center relative h-[55px] w-full")}>
          <EntryHeaderReadHistory className="left-0" />
          <div
            className={cn("relative z-10 flex w-full items-center justify-between gap-3")}
            data-hide-in-print
          >
            <EntryHeaderMeta />
            <EntryHeaderActionsContainer />
          </div>
        </div>

        {/* First-time user tutorial for scroll-to-exit */}
        <ScrollToExitTutorial show={!!entryId && isAtTop} />
      </EntryHeaderRoot>
    </>
  )
}

export const AIEntryHeader = memo(EntryHeaderImpl)
