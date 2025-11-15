import { RootPortal } from "@follow/components/ui/portal/index.js"
import type { FeedViewType } from "@follow/constants"
import { memo, useCallback } from "react"

import { MenuItemText } from "~/atoms/context-menu"
import { CommandActionButton } from "~/components/ui/button/CommandActionButton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu/dropdown-menu"
import { EntryActionDropdownItem, useSortedEntryActions } from "~/hooks/biz/useEntryActions"
import { useRequireLogin } from "~/hooks/common/useRequireLogin"
import { useCommand } from "~/modules/command/hooks/use-command"
import type { FollowCommandId } from "~/modules/command/types"

export const EntryHeaderActions = ({ entryId, view }: { entryId: string; view: FeedViewType }) => {
  const { mainAction: actionConfigs } = useSortedEntryActions({ entryId, view })
  const { withLoginGuard } = useRequireLogin()
  const resolveClick = useCallback(
    (action: MenuItemText | EntryActionDropdownItem) =>
      action.requiresLogin ? withLoginGuard(action.onClick) : action.onClick,
    [withLoginGuard],
  )

  return actionConfigs
    .filter((item) => item instanceof MenuItemText || item instanceof EntryActionDropdownItem)
    .map((config) => {
      const clickHandler = resolveClick(config)
      const baseTrigger = (
        <CommandActionButton
          active={config.active}
          key={config.id}
          // Handle shortcut globally
          disableTriggerShortcut
          commandId={config.id}
          onClick={clickHandler}
          shortcut={config.shortcut!}
          clickableDisabled={config.disabled}
          highlightMotion={config.notice}
          id={`${config.entryId}/${config.id}`}
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
                    onClick={resolveClick(child)!}
                    active={child.active}
                    disabled={child.disabled}
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
    disabled,
  }: {
    commandId: FollowCommandId
    onClick: () => void
    active?: boolean
    disabled?: boolean
  }) => {
    const command = useCommand(commandId)

    if (!command) return null

    return (
      <DropdownMenuItem
        key={command.id}
        className="pl-3"
        icon={command.icon}
        onSelect={disabled ? undefined : onClick}
        active={active}
        disabled={disabled}
      >
        {command.label.title}
      </DropdownMenuItem>
    )
  },
)
