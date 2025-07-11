import { useReplaceGlobalFocusableScope } from "@follow/components/common/Focusable/hooks.js"
import { KbdCombined } from "@follow/components/ui/kbd/Kbd.js"
import { Tooltip, TooltipContent, TooltipTrigger } from "@follow/components/ui/tooltip/index.js"
import { sortShortcutKeys } from "@follow/utils/utils"
import type { FC, RefObject, SVGProps } from "react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useOnClickOutside } from "usehooks-ts"

import { HotkeyScope } from "~/constants"

export interface KeyRecorderProps {
  onChange: (keys: string[] | null) => void
  onBlur: () => void
}

export const KeyRecorder: FC<KeyRecorderProps> = ({ onChange, onBlur }) => {
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
      className="text-text-secondary relative flex size-full items-center justify-center px-1 text-xs"
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
