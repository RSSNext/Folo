import { Spring } from "@follow/components/constants/spring.js"
import { AnimatePresence } from "motion/react"
import { memo, useEffect, useState } from "react"

import { m } from "~/components/common/Motion"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { useShowEntryDetailsColumn } from "~/hooks/biz/useShowEntryDetailsColumn"
import { EntryColumn } from "~/modules/entry-column"
import { EntryContent } from "~/modules/entry-content/components/entry-content"
import { AIEntryHeader } from "~/modules/entry-content/components/entry-header"
import { AppLayoutGridContainerProvider } from "~/providers/app-grid-layout-container-provider"

type MobileView = "list" | "entry"

interface MobileTimelineLayoutProps {
  entryId: string | undefined
  hasSelectedEntry: boolean
}

export const MobileTimelineLayout = memo(function MobileTimelineLayout({
  entryId,
  hasSelectedEntry,
}: MobileTimelineLayoutProps) {
  const [mobileView, setMobileView] = useState<MobileView>("list")
  const navigate = useNavigateEntry()
  const { view } = useRouteParamsSelector((state) => ({
    view: state.view,
  }))
  const showEntryDetailsColumn = useShowEntryDetailsColumn()
  // Auto-switch to entry view when entry is selected
  useEffect(() => {
    if (hasSelectedEntry && mobileView === "list") {
      setMobileView("entry")
    } else if (!hasSelectedEntry && mobileView === "entry") {
      setMobileView("list")
    }
  }, [hasSelectedEntry, mobileView])

  return (
    <div className="relative flex size-full flex-col overflow-hidden">
      <AppLayoutGridContainerProvider>
        <div className="relative flex size-full flex-col">
          {/* List View */}
          <AnimatePresence mode="wait">
            {mobileView === "list" && (
              <m.div
                key="mobile-list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={Spring.smooth(0.2)}
                className="absolute inset-0 flex size-full flex-col overflow-hidden"
              >
                <EntryColumn />
              </m.div>
            )}

            {/* Entry View */}
            {mobileView === "entry" && entryId && (
              <m.div
                key="mobile-entry"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={Spring.smooth(0.2)}
                className="absolute inset-0 flex size-full flex-col overflow-hidden bg-theme-background"
              >
                <div className="flex-shrink-0 bg-background">
                  <div className="flex items-center">
                    {/* Mobile back button - only show when EntryHeaderBreadcrumb doesn't show close button */}
                    {showEntryDetailsColumn && (
                      <button
                        type="button"
                        className="no-drag-region mx-2 inline-flex shrink-0 items-center rounded-full bg-transparent p-2 text-text-secondary hover:bg-fill/50 hover:text-text focus-visible:bg-fill/60"
                        onClick={() => navigate({ entryId: null, view })}
                      >
                        <i className="i-mingcute-close-line size-5" />
                      </button>
                    )}
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <AIEntryHeader entryId={entryId} />
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <EntryContent entryId={entryId} className="h-full" />
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </AppLayoutGridContainerProvider>
    </div>
  )
})
