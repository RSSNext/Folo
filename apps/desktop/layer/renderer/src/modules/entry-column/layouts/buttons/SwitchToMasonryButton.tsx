import { useMobile } from "@follow/components/hooks/useMobile.js"
import { ActionButton } from "@follow/components/ui/button/index.js"
import { SegmentGroup, SegmentItem } from "@follow/components/ui/segment/index.js"
import { Switch } from "@follow/components/ui/switch/index.js"
import { clsx, cn } from "@follow/utils/utils"
import { Popover, PopoverContent, PopoverPortal, PopoverTrigger } from "@radix-ui/react-popover"
import { useRef } from "react"
import { useTranslation } from "react-i18next"

import { setUISetting, useUISettingKey } from "~/atoms/settings/ui"
import { useHoverPopover } from "~/hooks/common/useHoverPopover"

export const SwitchToMasonryButton = () => {
  const isMasonry = useUISettingKey("pictureViewMasonry")
  const isImageOnly = useUISettingKey("pictureViewImageOnly")
  const { t } = useTranslation()
  const isMobile = useMobile()
  const { open, show, onOpenChange, triggerProps, contentProps } = useHoverPopover()
  const triggerRef = useRef<HTMLButtonElement>(null)

  if (isMobile) return null
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {/* The options show while the pointer rests on the button, and a click or Enter opens them
          with the focus in them, so they can be set from the keyboard. Escape or a click outside
          closes them. */}
      <PopoverTrigger asChild>
        <ActionButton
          ref={triggerRef}
          aria-label={t("entry_list_header.preview_mode")}
          {...triggerProps}
          onClick={(event) => {
            // A click keeps the options open instead of toggling them
            event.preventDefault()
            show()
          }}
        >
          <i className={cn(!isMasonry ? "i-mgc-grid-cute-re" : "i-mgc-grid-2-cute-re")} />
        </ActionButton>
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent
          sideOffset={12}
          side="bottom"
          aria-label={t("entry_list_header.preview_mode")}
          {...contentProps}
          // A click on the trigger keeps the options open instead of closing and reopening them
          onPointerDownOutside={(event) => {
            if (triggerRef.current?.contains(event.target as Node)) event.preventDefault()
          }}
          className={clsx(
            "z-10 rounded-xl border bg-background drop-shadow",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:slide-out-to-top-5 data-[state=open]:slide-in-from-top-5",
            "data-[state=closed]:slide-in-from-top-0 data-[state=open]:slide-in-from-top-0",
            "transition-all duration-200 ease-in-out",
            "p-3",
          )}
        >
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
                      <i className="i-mgc-grid-cute-re" />
                      <span>{t("entry_list_header.grid")}</span>
                    </div>
                  }
                />
                <SegmentItem
                  key="Masonry"
                  value="masonry"
                  label={
                    <div className="flex items-center gap-1 text-sm">
                      <i className="i-mgc-grid-2-cute-re" />
                      <span>{t("entry_list_header.masonry")}</span>
                    </div>
                  }
                />
              </SegmentGroup>
            </div>
            <div className="flex items-center justify-between">
              <label className="mr-2 w-[120px] text-sm">{t("entry_list_header.image_only")}</label>
              <Switch
                checked={isImageOnly}
                onCheckedChange={(checked) => {
                  setUISetting("pictureViewImageOnly", checked)
                }}
              />
            </div>
          </div>
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  )
}
