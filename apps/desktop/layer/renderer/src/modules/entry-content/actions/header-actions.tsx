import { RootPortal } from "@follow/components/ui/portal/index.js"
import type { FeedViewType } from "@follow/constants"
import { memo } from "react"

import { MenuItemText } from "~/atoms/context-menu"
import { CommandActionButton } from "~/components/ui/button/CommandActionButton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu/dropdown-menu"
import { EntryActionDropdownItem, useSortedEntryActions } from "~/hooks/biz/useEntryActions"
import { useCommand } from "~/modules/command/hooks/use-command"
import type { FollowCommandId } from "~/modules/command/types"

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
    .filter((item) => item instanceof MenuItemText || item instanceof EntryActionDropdownItem)
    .map((config) => {
      const baseTrigger = (
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

      if (config instanceof EntryActionDropdownItem && config.hasChildren) {
        return (
          <DropdownMenu key={config.id}>
            <DropdownMenuTrigger asChild>{baseTrigger}</DropdownMenuTrigger>
            <RootPortal>
              <DropdownMenuContent>
                {config.enabledChildren.map((child) => (
                  <CommandDropdownMenuItem
                    key={child.id}
                    commandId={child.id}
                    onClick={child.onClick!}
                    active={child.active}
                  />
                ))}
              </DropdownMenuContent>
            </RootPortal>
          </DropdownMenu>
        )
      }

      if (config instanceof MenuItemText) {
        return baseTrigger
      }

      return null
    })
}

const CommandDropdownMenuItem = memo(
  ({
    commandId,
    onClick,
    active,
  }: {
    commandId: FollowCommandId
    onClick: () => void
    active?: boolean
  }) => {
    const command = useCommand(commandId)

    if (!command) return null

    return (
      <DropdownMenuItem
        key={command.id}
        className="pl-3"
        icon={command.icon}
        onSelect={onClick}
        active={active}
      >
        {command.label.title}
      </DropdownMenuItem>
    )
  },
)
