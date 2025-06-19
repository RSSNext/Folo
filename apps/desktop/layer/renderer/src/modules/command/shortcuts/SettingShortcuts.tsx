import { useReplaceGlobalFocusableScope } from "@follow/components/common/Focusable/hooks.js"
import { Button } from "@follow/components/ui/button/index.js"
import { KbdCombined } from "@follow/components/ui/kbd/Kbd.js"
import { RootPortal } from "@follow/components/ui/portal/index.js"
import { Tooltip, TooltipContent, TooltipTrigger } from "@follow/components/ui/tooltip/index.js"
import { cn, sortShortcutKeys } from "@follow/utils/utils"
import type { FC, RefObject, SVGProps } from "react"
import { memo, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useOnClickOutside } from "usehooks-ts"

import { HotkeyScope } from "~/constants"

import { useCommand } from "../hooks/use-command"
import type { AllowCustomizeCommandId } from "../hooks/use-command-binding"
import {
  allowCustomizeCommands,
  defaultCommandShortcuts,
  useCommandShortcutItems,
  useCommandShortcuts,
  useIsShortcutConflict,
  useSetCustomCommandShortcut,
} from "../hooks/use-command-binding"
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

const KeyRecorder: FC<{
  onChange: (keys: string[] | null) => void
  onBlur: () => void
}> = ({ onChange, onBlur }) => {
  const { t } = useTranslation("shortcuts")
  const { currentKeys } = useShortcutRecorder()
  const setGlobalScope = useReplaceGlobalFocusableScope()

  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const { rollback } = setGlobalScope(HotkeyScope.Recording)
    if (ref.current) {
      ref.current.focus()
    }
    return () => {
      rollback()
    }
  }, [setGlobalScope])
  useOnClickOutside(ref as RefObject<HTMLElement>, () => {
    if (currentKeys.length > 0) {
      onChange(currentKeys)
    }
    onBlur()
  })
  return (
    <div
      className="text-text-secondary relative flex h-full items-center justify-center px-1 text-xs"
      tabIndex={-1}
      role="textbox"
      ref={ref}
    >
      {currentKeys.length > 0 ? (
        <div className="pr-4">
          <KbdCombined kbdProps={{ wrapButton: false }} joint={false}>
            {currentKeys.join("+")}
          </KbdCombined>
        </div>
      ) : (
        <span className="text-text-secondary pr-4">{t("settings.shortcuts.press_to_record")}</span>
      )}
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="hover:text-text absolute inset-y-0 -right-1 z-[1] flex items-center justify-center px-1"
            onClick={(e) => {
              e.stopPropagation()
              if (currentKeys.length === 0) {
                onChange(null)
              } else {
                onBlur()
              }
            }}
          >
            {currentKeys.length > 0 ? (
              <FamiconsArrowUndoCircle className="size-4" />
            ) : (
              <i className="i-mingcute-close-circle-fill size-4" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {currentKeys.length > 0 ? t("settings.shortcuts.undo") : t("settings.shortcuts.reset")}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

function FamiconsArrowUndoCircle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 512 512"
      {...props}
    >
      {/* Icon from Famicons by Family - https://github.com/familyjs/famicons/blob/main/LICENSE */}
      <path
        fill="currentColor"
        d="M256 48C141.13 48 48 141.13 48 256s93.13 208 208 208s208-93.13 208-208S370.87 48 256 48m97.67 281.1c-24.07-25.21-51.51-38.68-108.58-38.68v37.32a8.32 8.32 0 0 1-14.05 6L146.58 254a8.2 8.2 0 0 1 0-11.94L231 162.29a8.32 8.32 0 0 1 14.05 6v37.32c88.73 0 117.42 55.64 122.87 117.09c.73 7.72-8.85 12.05-14.25 6.4"
      />
    </svg>
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

///////

const MODIFIER_KEYS_MAP = {
  Control: "Control",
  Alt: "Alt",
  Shift: "Shift",
  Meta: "Meta",
} as const

const MODIFIER_KEYS_SET = new Set<string>(Object.values(MODIFIER_KEYS_MAP))

const F_KEY_REGEX = /^F(?:[1-9]|1[0-2])$/

const useShortcutRecorder = () => {
  const [currentKeys, setCurrentKeys] = useState<string[]>([])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()

      const { altKey, ctrlKey, metaKey, shiftKey, key: eventKey } = event

      let mainKeyPressed = eventKey

      if (mainKeyPressed.length === 1 && mainKeyPressed >= "a" && mainKeyPressed <= "z") {
        mainKeyPressed = mainKeyPressed.toUpperCase()
      } else if (mainKeyPressed === " ") {
        mainKeyPressed = "Space"
      }

      const pressedKeysSet = new Set<string>()

      if (shiftKey) pressedKeysSet.add(MODIFIER_KEYS_MAP.Shift)
      if (metaKey) pressedKeysSet.add(MODIFIER_KEYS_MAP.Meta)
      if (ctrlKey) pressedKeysSet.add(MODIFIER_KEYS_MAP.Control)
      if (altKey) pressedKeysSet.add(MODIFIER_KEYS_MAP.Alt)

      // If mainKeyPressed (from event.key) is not a modifier key, add it as the main key.
      // If mainKeyPressed is a modifier key (e.g., user only pressed Shift key, event.key is "Shift"),
      // it has already been handled and added to pressedKeysSet by the above if (shiftKey) logic,
      // so we don't need to add it again here.
      if (!MODIFIER_KEYS_SET.has(mainKeyPressed)) {
        pressedKeysSet.add(mainKeyPressed)
      }

      const currentCombination = Array.from(pressedKeysSet)

      // --- Start validation rules ---
      const nonModifierKeysInCombo = currentCombination.filter((key) => !MODIFIER_KEYS_SET.has(key))

      // Rule 2: Pure modifier key combinations are not allowed (e.g., just Shift, or Ctrl+Alt)
      if (nonModifierKeysInCombo.length === 0) {
        // When only modifier keys are pressed, currentCombination will still contain these modifiers.
        // For example, pressing only Shift, currentCombination is ["Shift"]
        // Here we don't update the state, indicating this is an invalid recording.
        // You can provide temporary UI feedback here, e.g.: "Recording: Shift"
        console.info(
          "Recording (invalid - modifiers only):",
          sortShortcutKeys(currentCombination).join(" + "),
        )
        return
      }

      // Typically shortcuts have only one "main" function key (e.g., Ctrl+A, Shift+F1)
      // If multiple non-modifier keys are detected (e.g., theoretically user pressing A and B simultaneously),
      // this is usually not a standard shortcut recording scenario
      // This check is mainly for code robustness, as `keydown` events typically focus on one main key at a time.
      if (nonModifierKeysInCombo.length > 1) {
        console.warn(
          "Recording (invalid - multiple main keys, this shouldn't normally happen):",
          sortShortcutKeys(currentCombination).join(" + "),
        )

        return
      }

      const primaryKey = nonModifierKeysInCombo[0]

      // Rule 3: Fn keys (F1-F12) can be single keys or modifier+Fn key combinations
      if (F_KEY_REGEX.test(primaryKey ?? "")) {
        setCurrentKeys(sortShortcutKeys(currentCombination))
        return
      }

      // Rule 1: Single "ASCII" main keys are allowed (here referring to all non-modifier, non-F keys)
      // Examples: A, 1, Space, Enter, ArrowUp, etc. They can be used alone or with modifiers.
      // For these keys, as long as they're not pure modifier combinations, they're considered valid.
      setCurrentKeys(sortShortcutKeys(currentCombination))
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [setCurrentKeys])
  return { currentKeys }
}
