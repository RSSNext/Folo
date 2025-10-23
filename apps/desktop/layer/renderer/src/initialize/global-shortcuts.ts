import { callWindowExposeRenderer } from "@follow/shared/bridge"
import { detectIsEditableElement } from "@follow/utils"

interface ShortcutDefinition {
  accelerator: string
  action: () => void
  inputBypass?: boolean
}

const parseAccelerator = (
  accelerator: string,
): { key: string; ctrl?: boolean; meta?: boolean; shift?: boolean } => {
  const parts = accelerator.toLowerCase().split("+")
  return {
    key: parts.at(-1) ?? "",
    ctrl: parts.includes("ctrl") || parts.includes("cmdorctrl"),
    meta: parts.includes("cmd") || parts.includes("cmdorctrl"),
    shift: parts.includes("shift"),
  }
}

export const registerAppGlobalShortcuts = () => {
  // @see layer/main/menu.ts
  const shortcuts: ShortcutDefinition[] = [
    {
      accelerator: "CmdOrCtrl+,",
      action: () => window.router.showSettings(),
      inputBypass: true,
    },
    {
      accelerator: "CmdOrCtrl+T",
      action: () => {
        const caller = callWindowExposeRenderer()
        caller.goToDiscover()
      },
    },
    {
      accelerator: "CmdOrCtrl+N",
      action: () => {
        const caller = callWindowExposeRenderer()
        caller.quickAdd()
      },
    },
  ]

  const handleKeydown = (e: KeyboardEvent) => {
    shortcuts.forEach(({ accelerator, action, inputBypass }) => {
      // Prevent on input, textarea, [contenteditable]
      if (!inputBypass && detectIsEditableElement(e.target as HTMLElement)) {
        return
      }

      const { key, ctrl, meta, shift } = parseAccelerator(accelerator)

      const matchesKey = e.key.toLowerCase() === key.toLowerCase()
      const matchesModifier = ctrl
        ? e.ctrlKey || e.metaKey
        : !ctrl && !e.ctrlKey && !meta && !e.metaKey
      const matchesShift = shift ? e.shiftKey : !e.shiftKey

      if (matchesKey && matchesModifier && matchesShift) {
        action()
        e.preventDefault()
      }
    })
  }

  document.addEventListener("keydown", handleKeydown, true)

  return () => {
    document.removeEventListener("keydown", handleKeydown, true)
  }
}
