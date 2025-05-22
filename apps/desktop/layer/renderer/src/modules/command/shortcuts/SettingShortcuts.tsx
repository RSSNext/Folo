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

export const ShortcutSetting = () => {
  const { t } = useTranslation("shortcuts")
  const commandShortcuts = useCommandShortcutItems()

  return (
    <div>
      <p className="mb-6 mt-4 space-y-2 text-sm">{t("settings.shortcuts.description")}</p>
      {Object.entries(commandShortcuts).map(([type, commands]) => (
        <section key={type} className="mb-8">
          <div className="text-text border-border mb-4 border-b pb-2 text-base font-medium">
            {t(type as CommandCategory)}
          </div>
          <div className="space-y-4">
            {commands.map((commandId) => (
              <EditableCommandShortcutItem key={commandId} commandId={commandId} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

const EditableCommandShortcutItem = memo(({ commandId }: { commandId: FollowCommandId }) => {
  const command = useCommand(commandId)
  const commandShortcuts = useCommandShortcuts()
  // const [isEditing, setIsEditing] = useState(false)
  if (!command) return null
  return (
    <div className={"flex h-8 items-center justify-between py-1.5"}>
      <div className="text-text text-sm">{command.label.title}</div>
      {!!command.label.description && (
        <small className="text-text-secondary text-xs">{command.label.description}</small>
      )}
      <div>
        <KbdCombined kbdProps={{ wrapButton: false }} joint={false}>
          {commandShortcuts[commandId]}
        </KbdCombined>
      </div>
    </div>
  )
})
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
