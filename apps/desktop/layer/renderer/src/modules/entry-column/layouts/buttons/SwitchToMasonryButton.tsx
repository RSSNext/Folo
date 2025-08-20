import { useMobile } from "@follow/components/hooks/useMobile.js"
import { AutoResizeHeight } from "@follow/components/ui/auto-resize-height/index.js"
import { ActionButton } from "@follow/components/ui/button/index.js"
import { SegmentGroup, SegmentItem } from "@follow/components/ui/segment/index.js"
import { clsx, cn } from "@follow/utils/utils"
import {
  HoverCard,
  HoverCardContent,
  HoverCardPortal,
  HoverCardTrigger,
} from "@radix-ui/react-hover-card"
import { useTranslation } from "react-i18next"

import { setUISetting, useUISettingKey } from "~/atoms/settings/ui"

export const SwitchToMasonryButton = () => {
  const isMasonry = useUISettingKey("pictureViewMasonry")
  const { t } = useTranslation()
  const isMobile = useMobile()

  if (isMobile) return null
  return (
    <HoverCard openDelay={100}>
      <HoverCardTrigger>
        <ActionButton>
          <i className={cn(!isMasonry ? "i-mgc-grid-cute-re" : "i-mgc-grid-2-cute-re")} />
        </ActionButton>
      </HoverCardTrigger>
      <HoverCardPortal>
        <HoverCardContent
          sideOffset={12}
          side="bottom"
          className={clsx(
            "bg-background z-10 rounded-xl border drop-shadow",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:slide-out-to-top-5 data-[state=open]:slide-in-from-top-5",
            "data-[state=closed]:slide-in-from-top-0 data-[state=open]:slide-in-from-top-0",
            "transition-all duration-200 ease-in-out",
            "px-3 py-2",
          )}
        >
          <AutoResizeHeight>
            <div className="flex flex-col gap-3">
              <div className="flex items-center">
                <label className="mr-2 w-[120px] text-sm">
                  {t("entry_list_header.preview_mode")}
                </label>
                <SegmentGroup
                  className="h-8"
                  value={isMasonry ? "masonry" : "grid"}
                  onValueChanged={(v) => {
                    setUISetting("pictureViewMasonry", v === "masonry")
                  }}
                >
                  <SegmentItem
                    key="Grid"
                    value="grid"
                    label={
                      <div className="flex items-center gap-1 text-sm">
                        <i className="i-mgc-grid-2-cute-re" />
                        <span>{t("entry_list_header.grid")}</span>
                      </div>
                    }
                  />
                  <SegmentItem
                    key="Masonry"
                    value="masonry"
                    label={
                      <div className="flex items-center gap-1 text-sm">
                        <i className="i-mgc-grid-cute-re" />
                        <span>{t("entry_list_header.masonry")}</span>
                      </div>
                    }
                  />
                </SegmentGroup>
              </div>
            </div>
          </AutoResizeHeight>
        </HoverCardContent>
      </HoverCardPortal>
    </HoverCard>
  )
}
