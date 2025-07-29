import type { FeedViewType } from "@follow/constants"

import { MenuItemText } from "~/atoms/context-menu"
import { CommandActionButton } from "~/components/ui/button/CommandActionButton"
import { useSortedEntryActions } from "~/hooks/biz/useEntryActions"

export const EntryHeaderActions = ({
  entryId,
  view,
  compact,
}: {
  entryId: string
  view: FeedViewType
  compact?: boolean
}) => {
  const { mainAction: actionConfigs } = useSortedEntryActions({ entryId, view, compact })

  return actionConfigs
    .filter((item) => item instanceof MenuItemText)
    .map((config) => {
      return (
        <CommandActionButton
          active={config.active}
          key={config.id}
          // Handle shortcut globally
          disableTriggerShortcut
          commandId={config.id}
          onClick={config.onClick!}
          shortcut={config.shortcut!}
          clickableDisabled={config.disabled}
          highlightMotion={config.notice}
          id={`${config.entryId}/${config.id}`}
          size={compact ? "xs" : "base"}
        />
      )
    })
}
