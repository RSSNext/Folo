import { Button } from "@follow/components/ui/button/index.js"
import { Checkbox } from "@follow/components/ui/checkbox/index.jsx"
import { Input, TextArea } from "@follow/components/ui/input/index.js"
import { Label } from "@follow/components/ui/label/index.jsx"
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@follow/components/ui/popover/index.js"
import { Switch } from "@follow/components/ui/switch/index.jsx"
import type { AIShortcut, AIShortcutTarget } from "@follow/shared/settings/interface"
import { DEFAULT_SHORTCUT_TARGETS } from "@follow/shared/settings/interface"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { isServerShortcut } from "~/atoms/settings/ai"

interface ShortcutModalContentProps {
  shortcut?: AIShortcut | null
  onSave: (shortcut: Omit<AIShortcut, "id">) => void
  onCancel: () => void
}

export const ShortcutModalContent = ({ shortcut, onSave, onCancel }: ShortcutModalContentProps) => {
  const { t } = useTranslation("ai")
  const [name, setName] = useState(shortcut?.name || "")
  const [prompt, setPrompt] = useState(shortcut?.prompt || "")
  const [enabled, setEnabled] = useState(shortcut?.enabled ?? true)
  const [icon, setIcon] = useState<string>(shortcut?.icon || "i-mgc-hotkey-cute-re")
  const initialTargets = useMemo<AIShortcutTarget[]>(() => {
    if (shortcut?.displayTargets && shortcut.displayTargets.length > 0) {
      return [...shortcut.displayTargets]
    }
    return [...DEFAULT_SHORTCUT_TARGETS]
  }, [shortcut?.displayTargets])
  const [displayTargets, setDisplayTargets] = useState<AIShortcutTarget[]>(initialTargets)
  const PRESET_ICONS = useMemo(
    () => [
      "i-mgc-hotkey-cute-re",
      "i-mgc-magic-2-cute-re",
      "i-mgc-thought-cute-fi",
      "i-mgc-rocket-cute-re",
      "i-mgc-quill-pen-cute-re",
      "i-mgc-search-3-cute-re",
      "i-mgc-brain-cute-re",
      "i-mgc-list-check-3-cute-re",
      "i-mgc-translate-2-cute-re",
      "i-mgc-send-plane-cute-re",
      "i-mgc-hammer-cute-re",
      "i-mgc-settings-1-cute-re",
      "i-mgc-test-tube-cute-re",
      "i-mgc-star-cute-re",
      "i-mgc-bookmark-cute-re",
      "i-mgc-book-6-cute-re",
      "i-mgc-plugin-2-cute-re",
      "i-mgc-grid-2-cute-re",
      "i-mgc-palette-cute-re",
      "i-mgc-fire-cute-re",
      "i-mgc-gift-cute-re",
      "i-mgc-trophy-cute-re",
      "i-mgc-tool-cute-re",
      "i-mgc-link-cute-re",
      "i-mgc-attachment-cute-re",
      "i-mgc-external-link-cute-re",
      "i-mgc-copy-2-cute-re",
    ],
    [],
  )
  const isServer = shortcut && isServerShortcut(shortcut)

  useEffect(() => {
    setDisplayTargets(initialTargets)
  }, [initialTargets])

  const handleTargetChange = (target: AIShortcutTarget, checked: boolean) => {
    setDisplayTargets((prev) => {
      if (checked) {
        if (prev.includes(target)) {
          return prev
        }
        return [...prev, target]
      }
      return prev.filter((item) => item !== target)
    })
  }

  const handleSave = () => {
    const trimmedName = name.trim()
    const trimmedPrompt = prompt.trim()
    const effectivePrompt = trimmedPrompt || shortcut?.defaultPrompt

    if (!trimmedName) {
      toast.error(t("shortcuts.validation.name_required"))
      return
    }

    if (!effectivePrompt) {
      toast.error(t("shortcuts.validation.prompt_required"))
      return
    }
    if (displayTargets.length === 0) {
      toast.error(t("shortcuts.validation.targets_required"))
      return
    }

    onSave({
      name: trimmedName,
      prompt: trimmedPrompt,
      defaultPrompt: shortcut?.defaultPrompt,
      enabled,
      icon,
      displayTargets,
    })
  }

  return (
    <div className="w-[400px] space-y-4">
      <div className="grid grid-cols-6 gap-4">
        <div className="col-span-6 space-y-2">
          <Label className="text-xs text-text">{t("shortcuts.name")}</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("shortcuts.name_placeholder")}
          />
        </div>
      </div>

      <div className="flex items-center justify-between space-y-2">
        <Label className="text-xs text-text">{t("shortcuts.icon")}</Label>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              buttonClassName="size-8 flex items-center justify-center"
              title={t("shortcuts.icon")}
            >
              <i className={icon || "i-mgc-hotkey-cute-re"} />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="shadow-context-menu w-[280px] p-2">
            <div className="grid grid-cols-7 gap-1.5">
              {PRESET_ICONS.map((klass) => (
                <PopoverClose asChild key={klass}>
                  <button
                    type="button"
                    className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-material-thin text-text hover:bg-fill hover:text-text-vibrant"
                    onClick={() => setIcon(klass)}
                    title={klass}
                  >
                    <i className={klass} />
                  </button>
                </PopoverClose>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {isServer ? (
        <div className="space-y-2">
          <Label className="text-xs text-text">{t("shortcuts.default_prompt.label")}</Label>
          <div className="select-text whitespace-pre-wrap rounded-md border border-border bg-material-thin px-3 py-2 text-xs leading-relaxed text-text">
            {shortcut?.defaultPrompt}
          </div>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label className="text-xs text-text">
          {t(isServer ? "shortcuts.custom_prompt.title" : "shortcuts.prompt")}
        </Label>
        <TextArea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t(
            isServer ? "shortcuts.custom_prompt_placeholder" : "shortcuts.prompt_placeholder",
          )}
          className="min-h-[120px] resize-none py-2 text-sm"
        />
        {isServer && (
          <p className="text-xs text-text-tertiary">{t("shortcuts.custom_prompt.help")}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-text">{t("shortcuts.targets.label")}</Label>
        <div className="flex flex-wrap gap-3 text-xs text-text-secondary">
          <label className="flex items-center gap-2">
            <Checkbox
              size="sm"
              checked={displayTargets.includes("list")}
              onCheckedChange={(value) => handleTargetChange("list", Boolean(value))}
            />
            <span>{t("shortcuts.targets.list")}</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              size="sm"
              checked={displayTargets.includes("entry")}
              onCheckedChange={(value) => handleTargetChange("entry", Boolean(value))}
            />
            <span>{t("shortcuts.targets.entry")}</span>
          </label>
        </div>
        <p className="text-xs text-text-tertiary">{t("shortcuts.targets.help")}</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch size="sm" checked={enabled} onCheckedChange={setEnabled} />
          <Label className="text-xs text-text">{t("shortcuts.enabled")}</Label>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
