import { useGlobalFocusableScopeSelector } from "@follow/components/common/Focusable/hooks.js"
import type { FeedViewType } from "@follow/constants"
import { useEntry } from "@follow/store/entry/hooks"

import { FocusablePresets } from "~/components/common/Focusable"
import { useHasModal } from "~/components/ui/modal/stacked/hooks"
import { COMMAND_ID } from "~/modules/command/commands/id"
import { useCommandBinding } from "~/modules/command/hooks/use-command-binding"
/**
 * Centralized management of entry command shortcut key
 */
export const EntryCommandShortcutRegister = ({
  entryId,
  view,
}: {
  entryId: string
  view: FeedViewType
}) => {
  const hasModal = useHasModal()
  const entry = useEntry(entryId, (state) => ({ url: state.url }))

  const when = useGlobalFocusableScopeSelector(FocusablePresets.isEntryRender)
  const baseCondition = !hasModal && when

  useCommandBinding({
    when: baseCondition && !!entry?.url,
    commandId: COMMAND_ID.entry.openInBrowser,
    args: [{ entryId }],
  })

  useCommandBinding({
    when: baseCondition && !!entry?.url,
    commandId: COMMAND_ID.entry.copyLink,
    args: [{ entryId }],
  })

  useCommandBinding({
    when: baseCondition,
    commandId: COMMAND_ID.entry.read,
    args: [{ entryId }],
  })

  useCommandBinding({
    when: baseCondition,
    commandId: COMMAND_ID.entry.star,
    args: [{ entryId, view }],
  })

  useCommandBinding({
    when: baseCondition,
    commandId: COMMAND_ID.entry.tip,
    args: [{ entryId }],
  })

  useCommandBinding({
    when: baseCondition,
    commandId: COMMAND_ID.entry.copyTitle,
    args: [{ entryId }],
  })

  useCommandBinding({
    when: baseCondition,
    commandId: COMMAND_ID.entry.share,
    args: [{ entryId }],
  })

  return null
}
