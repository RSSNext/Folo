import type { FeedViewType } from "@follow/constants"

import { CommandActionButton } from "~/components/ui/button/CommandActionButton"
import { useHasModal } from "~/components/ui/modal/stacked/hooks"
import { shortcuts } from "~/constants/shortcuts"
import { useSortedEntryActions } from "~/hooks/biz/useEntryActions"
import { COMMAND_ID } from "~/modules/command/commands/id"
import { useCommandHotkey } from "~/modules/command/hooks/use-register-hotkey"
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
  const entry = useEntry(entryId)

  const hasModal = useHasModal()

  useCommandHotkey({
    when: !!entry?.entries.url && !hasModal,
    shortcut: shortcuts.entry.openInBrowser.key,
    commandId: COMMAND_ID.entry.openInBrowser,
    args: [{ entryId }],
  })

  return actionConfigs.map((config) => {
    return (
      <CommandActionButton
        active={config.active}
        key={config.id}
        disableTriggerShortcut={hasModal}
        commandId={config.id}
        onClick={config.onClick}
        shortcut={config.shortcut}
        clickableDisabled={config.disabled}
        tooltipDefaultOpen={config.notice}
        id={`${config.entryId}/${config.id}`}
      />
    )
  })
}
