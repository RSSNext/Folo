import { RootPortal } from "@follow/components/ui/portal/index.js"
import type { FC } from "react"
import { useMemo } from "react"

import { MenuItemText } from "~/atoms/context-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu/dropdown-menu"
import { useSortedEntryActions } from "~/hooks/biz/useEntryActions"
import { getRouteParams } from "~/hooks/biz/useRouteParams"
import { COMMAND_ID } from "~/modules/command/commands/id"
import { hasCommand } from "~/modules/command/hooks/use-command"
import { CommandDropdownMenuItem } from "~/modules/entry-content/actions/more-actions"

export const EntryMoreActions: FC<{ entryId: string }> = ({ entryId }) => {
  const { view } = getRouteParams()
  const { moreAction, mainAction } = useSortedEntryActions({ entryId, view })

  const actionConfigs = useMemo(
    () =>
      [...moreAction, ...mainAction].filter(
        (action) => action instanceof MenuItemText && hasCommand(action.id),
      ),
    [moreAction, mainAction],
  )

  const availableActions = useMemo(
    () =>
      actionConfigs.filter(
        (item) => item instanceof MenuItemText && item.id !== COMMAND_ID.settings.customizeToolbar,
      ),
    [actionConfigs],
  )

  const extraAction = useMemo(
    () =>
      actionConfigs.filter(
        (item) => item instanceof MenuItemText && item.id === COMMAND_ID.settings.customizeToolbar,
      ),
    [actionConfigs],
  )

  if (availableActions.length === 0 && extraAction.length === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <i className="i-mgc-more-1-cute-re" />
      </DropdownMenuTrigger>
      <RootPortal>
        <DropdownMenuContent alignOffset={20} sideOffset={30}>
          {availableActions.map((config) =>
            config instanceof MenuItemText ? (
              <CommandDropdownMenuItem
                key={config.id}
                commandId={config.id}
                onClick={config.click!}
                active={config.active}
              />
            ) : null,
          )}
        </DropdownMenuContent>
      </RootPortal>
    </DropdownMenu>
  )
}
