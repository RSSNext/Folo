import { Button } from "@follow/components/ui/button/index.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { cn } from "@follow/utils"

import { useSettingModal } from "~/modules/settings/modal/useSettingModal"

import { mockShortcuts } from "../mock-data"

export const AIChatShortcuts = ({
  className,
  onSubmit,
}: {
  className?: string
  onSubmit?: (value: string) => void
}) => {
  const settingModalPresent = useSettingModal()

  return (
    <ScrollArea
      orientation="horizontal"
      viewportClassName={cn("text-text whitespace-nowrap pb-2 pt-1", className)}
    >
      {mockShortcuts.map((shortcut) => (
        <Button
          key={shortcut.name}
          variant="outline"
          buttonClassName="rounded-full h-7 mr-1"
          size="sm"
          onClick={() => {
            onSubmit?.(shortcut.prompt)
          }}
        >
          {shortcut.name}
        </Button>
      ))}
      <Button
        variant="outline"
        buttonClassName="rounded-full size-7"
        size="sm"
        onClick={() => {
          settingModalPresent("ai")
        }}
      >
        +
      </Button>
    </ScrollArea>
  )
}
