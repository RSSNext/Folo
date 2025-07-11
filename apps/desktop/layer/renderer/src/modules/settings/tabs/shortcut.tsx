import { Button } from "@follow/components/ui/button/index.jsx"
import { KbdCombined } from "@follow/components/ui/kbd/Kbd.js"
import { RootPortal } from "@follow/components/ui/portal/index.js"
import { Tooltip, TooltipContent, TooltipTrigger } from "@follow/components/ui/tooltip/index.js"
import { cn } from "@follow/utils"
import { memo, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { KeyRecorder } from "~/components/ui/keyboard-recorder"
import { useCommand } from "~/modules/command/hooks/use-command"
import type { AllowCustomizeCommandId } from "~/modules/command/hooks/use-command-binding"
import {
  allowCustomizeCommands,
  defaultCommandShortcuts,
  useCommandShortcutItems,
  useCommandShortcuts,
  useIsShortcutConflict,
  useSetCustomCommandShortcut,
} from "~/modules/command/hooks/use-command-binding"
import type { CommandCategory, FollowCommandId } from "~/modules/command/types"

export const ShortcutSetting = () => {
  const { t } = useTranslation("shortcuts")
  const commandShortcuts = useCommandShortcutItems()
  const currentShortcuts = useCommandShortcuts()
  const setCustomCommandShortcut = useSetCustomCommandShortcut()

  // Check if any shortcuts have been customized
  const hasCustomizedShortcuts = useMemo(() => {
    return Object.entries(currentShortcuts).some(([commandId, shortcut]) => {
      return (
        allowCustomizeCommands.has(commandId as AllowCustomizeCommandId) &&
        shortcut !== defaultCommandShortcuts[commandId as keyof typeof defaultCommandShortcuts]
      )
    })
  }, [currentShortcuts])

  const resetDefaults = () => {
    Object.entries(defaultCommandShortcuts).forEach(([commandId, shortcut]) => {
      if (allowCustomizeCommands.has(commandId as AllowCustomizeCommandId)) {
        setCustomCommandShortcut(commandId as AllowCustomizeCommandId, shortcut)
      }
    })
  }

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

      <div className="mb-4 flex min-h-6 items-center justify-end">
        {hasCustomizedShortcuts && (
          <Button variant={"outline"} onClick={resetDefaults}>
            Reset Defaults
          </Button>
        )}
      </div>
    </div>
  )
}

const EditableCommandShortcutItem = memo(({ commandId }: { commandId: FollowCommandId }) => {
  const { t } = useTranslation("shortcuts")
  const command = useCommand(commandId)
  const commandShortcuts = useCommandShortcuts()
  const [isEditing, setIsEditing] = useState(false)

  const setCustomCommandShortcut = useSetCustomCommandShortcut()
  const allowCustomize = allowCustomizeCommands.has(commandId as AllowCustomizeCommandId)

  if (!command) return null

  const isUserCustomize = commandShortcuts[commandId] !== defaultCommandShortcuts[commandId]

  return (
    <div
      className={
        "relative box-content grid h-8 grid-cols-[auto_200px] items-center justify-between gap-x-8 py-1.5"
      }
    >
      <div className="flex min-w-0 flex-col gap-1">
        <div className="text-text flex items-center gap-2 text-sm">
          {command.label.title}
          {isUserCustomize && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-accent/10 text-accent hover:bg-accent/20 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-all duration-200">
                  <div className="bg-accent mr-1 size-2 rounded-full" />
                  {t("settings.shortcuts.custom")}
                </div>
              </TooltipTrigger>
              <TooltipContent>{t("settings.shortcuts.custom_content")}</TooltipContent>
            </Tooltip>
          )}
        </div>
        {!!command.label.description && (
          <small className="text-text-secondary text-xs">{command.label.description}</small>
        )}
      </div>
      <ShortcutInputWrapper
        commandId={commandId}
        shortcut={commandShortcuts[commandId]}
        isEditing={isEditing}
        isUserCustomize={isUserCustomize}
        allowCustomize={allowCustomize}
        onEditingChange={setIsEditing}
        onShortcutChange={(shortcut) => {
          setCustomCommandShortcut(commandId as AllowCustomizeCommandId, shortcut)
          setIsEditing(false)
        }}
      />
    </div>
  )
})

interface ShortcutInputWrapperProps {
  commandId: FollowCommandId
  shortcut: string
  isEditing: boolean
  isUserCustomize: boolean
  allowCustomize: boolean
  onEditingChange: (editing: boolean) => void
  onShortcutChange: (shortcut: string | null) => void
}

const ShortcutInputWrapper = memo(
  ({
    commandId,
    shortcut,
    isEditing,
    isUserCustomize,
    allowCustomize,
    onEditingChange,
    onShortcutChange,
  }: ShortcutInputWrapperProps) => {
    const { t } = useTranslation("shortcuts")
    const conflictResult = useIsShortcutConflict(shortcut, commandId as AllowCustomizeCommandId)

    const hasConflict = allowCustomize && conflictResult.hasConflict
    const conflictingCommandId = allowCustomize ? conflictResult.conflictingCommandId : null

    const conflictCommand = useCommand(conflictingCommandId as FollowCommandId)

    const getBorderColor = () => {
      if (hasConflict) {
        return "border-red/70 hover:!border-red"
      }
      if (isEditing) {
        return "border-border bg-material-ultra-thick"
      }
      if (allowCustomize) {
        return "border-border/50 bg-material-ultra-thin data-[customized=true]:bg-accent/10 data-[customized=true]:border-accent/50"
      }
      return "border-transparent"
    }

    const getBackgroundColor = () => {
      if (hasConflict && !isEditing) {
        return "bg-red/5"
      }
      if (isEditing) {
        return "bg-material-ultra-thick"
      }
      return ""
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            data-customized={isUserCustomize}
            className={cn(
              "relative flex h-full cursor-text justify-end rounded-md border px-1 duration-200",
              allowCustomize && "hover:!border-border hover:!bg-material-medium",
              getBorderColor(),
              getBackgroundColor(),
              !allowCustomize && "pointer-events-none",
            )}
            onClick={() => {
              if (allowCustomize) {
                onEditingChange(!isEditing)
              }
            }}
          >
            {isEditing ? (
              <KeyRecorder
                onBlur={() => {
                  onEditingChange(false)
                }}
                onChange={(keys) => {
                  onShortcutChange(Array.isArray(keys) ? keys.join("+") : null)
                }}
              />
            ) : (
              <KbdCombined kbdProps={{ wrapButton: false }} joint={false}>
                {shortcut}
              </KbdCombined>
            )}
          </button>
        </TooltipTrigger>
        {hasConflict && (
          <RootPortal>
            <TooltipContent className="max-w-xs p-2">
              <div className="space-y-1">
                <div className="font-medium text-red-400">{t("settings.shortcuts.conflict")}</div>
                <div className="leading-6">
                  <span className="text-text-secondary text-xs">
                    {t("settings.shortcuts.conflict_command")}
                  </span>
                  <p className="text-sm font-medium">{conflictCommand?.label.title}</p>
                </div>
              </div>
            </TooltipContent>
          </RootPortal>
        )}
      </Tooltip>
    )
  },
)
