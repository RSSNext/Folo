import { useGlobalFocusableScopeSelector } from "@follow/components/common/Focusable/hooks.js"

import { FocusablePresets } from "~/components/common/Focusable"
import { COMMAND_ID } from "~/modules/command/commands/id"
import { useCommandBinding } from "~/modules/command/hooks/use-command-binding"

export const MainViewHotkeysProvider = () => {
  const notInFloatingLayerScope = useGlobalFocusableScopeSelector(
    FocusablePresets.isNotFloatingLayerScope,
  )

  useCommandBinding({
    commandId: COMMAND_ID.global.toggleAIChat,
    when: notInFloatingLayerScope,
  })

  return null
}
