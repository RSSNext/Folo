import { KbdCombined } from "@follow/components/ui/kbd/Kbd.js"
import { memo } from "react"
import { useTranslation } from "react-i18next"

import { useCommand } from "../hooks/use-command"
import { useCommandShortcutItems, useCommandShortcuts } from "../hooks/use-command-binding"
import type { CommandCategory, FollowCommandId } from "../types"

export const ShortcutsGuideline = () => {
  const { t } = useTranslation("shortcuts")
  const commandShortcuts = useCommandShortcutItems()

  return (
    <div className="mt-4 space-y-6">
      {Object.entries(commandShortcuts).map(([type, commands]) => (
        <section key={type}>
          <div className="text-text-secondary mb-2 pl-3 text-sm font-medium capitalize">
            {t(type as CommandCategory)}
          </div>
          <div className="text-text rounded-md border text-[13px]">
            {commands.map((commandId) => (
              <CommandShortcutItem key={commandId} commandId={commandId} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

const CommandShortcutItem = memo(({ commandId }: { commandId: FollowCommandId }) => {
  const command = useCommand(commandId)
  const commandShortcuts = useCommandShortcuts()

  if (!command) return null
  return (
    <div className={"odd:bg-fill-quinary flex h-9 items-center justify-between px-3 py-1.5"}>
      <div>{command.label.title}</div>
      <div>
        <KbdCombined joint>{commandShortcuts[commandId]}</KbdCombined>
      </div>
    </div>
  )
})
