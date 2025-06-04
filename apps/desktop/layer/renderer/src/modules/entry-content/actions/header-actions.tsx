import { useGlobalFocusableScopeSelector } from "@follow/components/common/Focusable/hooks.js"
import type { FeedViewType } from "@follow/constants"

import { MenuItemText } from "~/atoms/context-menu"
import { FocusablePresets } from "~/components/common/Focusable"
import { CommandActionButton } from "~/components/ui/button/CommandActionButton"
import { useHasModal } from "~/components/ui/modal/stacked/hooks"
import { useSortedEntryActions } from "~/hooks/biz/useEntryActions"
import { COMMAND_ID } from "~/modules/command/commands/id"
import { useCommandBinding } from "~/modules/command/hooks/use-command-binding"
import { useEntry } from "~/store/entry/hooks"

export const EntryHeaderActions = ({
  entryId,
  view,
  compact,
}: {
  entryId: string
  view?: FeedViewType
  compact?: boolean
}) => {
  const { mainAction: actionConfigs } = useSortedEntryActions({ entryId, view, compact })
  const entry = useEntry(entryId, (state) => ({ url: state.entries.url }))

  const hasModal = useHasModal()

  const when = useGlobalFocusableScopeSelector(FocusablePresets.isEntryRender)

  useCommandBinding({
    when: !!entry?.url && !hasModal && when,
    commandId: COMMAND_ID.entry.openInBrowser,
    args: [{ entryId }],
  })

  return actionConfigs
    .filter((item) => item instanceof MenuItemText)
    .map((config) => {
      return (
        <CommandActionButton
          active={config.active}
          key={config.id}
          disableTriggerShortcut={!when}
          commandId={config.id}
          onClick={config.onClick!}
          shortcut={config.shortcut!}
          clickableDisabled={config.disabled}
          highlightMotion={config.notice}
          id={`${config.entryId}/${config.id}`}
        />
      )
    })
}
