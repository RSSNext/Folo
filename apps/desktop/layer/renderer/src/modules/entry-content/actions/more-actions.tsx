import { ActionButton } from "@follow/components/ui/button/index.js"
import { RootPortal } from "@follow/components/ui/portal/index.js"
import type { FeedViewType } from "@follow/constants"
import { useMemo } from "react"

import { MenuItemText } from "~/atoms/context-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu/dropdown-menu"
import {
  EntryActionDropdownItem,
  EntryActionMenuItem,
  useSortedEntryActions,
} from "~/hooks/biz/useEntryActions"
import { COMMAND_ID } from "~/modules/command/commands/id"
import { hasCommand, useCommand, useRunCommandFn } from "~/modules/command/hooks/use-command"
import type { FollowCommandId } from "~/modules/command/types"

export const MoreActions = ({
  entryId,
  view,
  compact,
}: {
  entryId: string
  view: FeedViewType
  compact?: boolean
}) => {
  const { moreAction } = useSortedEntryActions({ entryId, view })

  const actionConfigs = useMemo(
    () =>
      moreAction.filter(
        (action) =>
          (action instanceof MenuItemText || action instanceof EntryActionDropdownItem) &&
          hasCommand(action.id),
      ),
    [moreAction],
  )

  const availableActions = useMemo(
    () =>
      actionConfigs.filter(
        (item) =>
          (item instanceof MenuItemText || item instanceof EntryActionDropdownItem) &&
          item.id !== COMMAND_ID.settings.customizeToolbar,
      ),
    [actionConfigs],
  )

  const runCmdFn = useRunCommandFn()
  const extraAction: EntryActionMenuItem[] = useMemo(
    () => [
      new EntryActionMenuItem({
        id: COMMAND_ID.settings.customizeToolbar,
        onClick: runCmdFn(COMMAND_ID.settings.customizeToolbar, []),
        entryId,
      }),
    ],
    [entryId, runCmdFn],
  )

  if (availableActions.length === 0 && extraAction.length === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ActionButton
          icon={<i className="i-mgc-more-1-cute-re" />}
          size={compact ? "xs" : "base"}
        />
      </DropdownMenuTrigger>
      <RootPortal>
        <DropdownMenuContent>
          {availableActions.map((config) => {
            // Handle EntryActionI with sub-menu
            if (config instanceof EntryActionDropdownItem && config.hasChildren) {
              return (
                <DropdownMenuSub key={config.id}>
                  <DropdownMenuSubTrigger>
                    <CommandDropdownMenuItem
                      commandId={config.id}
                      onClick={config.onClick!}
                      active={config.active}
                      asSubTrigger
                    />
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {config.enabledChildren.map((child) => (
                      <CommandDropdownMenuItem
                        key={child.id}
                        commandId={child.id}
                        onClick={child.onClick!}
                        active={child.active}
                      />
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )
            }

            // Handle regular MenuItemText
            if (config instanceof MenuItemText) {
              return (
                <CommandDropdownMenuItem
                  key={config.id}
                  commandId={config.id}
                  onClick={config.onClick!}
                  active={config.active}
                />
              )
            }

            return null
          })}
          {availableActions.length > 0 && <DropdownMenuSeparator />}
          {extraAction
            .filter((item) => item instanceof MenuItemText)
            .map((config) => (
              <CommandDropdownMenuItem
                key={config.id}
                commandId={config.id}
                onClick={config.onClick!}
                active={config.active}
              />
            ))}
        </DropdownMenuContent>
      </RootPortal>
    </DropdownMenu>
  )
}

export const CommandDropdownMenuItem = ({
  commandId,
  onClick,
  active,
  asSubTrigger = false,
}: {
  commandId: FollowCommandId | string
  onClick: () => void
  active?: boolean
  asSubTrigger?: boolean
}) => {
  const command = useCommand(commandId as any)

  // For custom integration items
  if (typeof commandId === "string" && commandId.startsWith("integration:custom:")) {
    const content = (
      <>
        <i className="i-mgc-webhook-cute-re mr-2" />
        Custom Integration
      </>
    )

    if (asSubTrigger) {
      return content
    }

    return (
      <DropdownMenuItem key={commandId} className="pl-3" onSelect={onClick} active={active}>
        {content}
      </DropdownMenuItem>
    )
  }

  if (!command) return null

  const content = (
    <>
      {command.icon}
      {command.label.title}
    </>
  )

  if (asSubTrigger) {
    return content
  }

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
}
