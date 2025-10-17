import { Button } from "@follow/components/ui/button/index.js"
import { Checkbox } from "@follow/components/ui/checkbox/index.jsx"
import { Input, TextArea } from "@follow/components/ui/input/index.js"
import { Label } from "@follow/components/ui/label/index.jsx"
import { Switch } from "@follow/components/ui/switch/index.jsx"
import {
  DEFAULT_SUMMARIZE_TIMELINE_PROMPT,
  DEFAULT_SUMMARIZE_TIMELINE_SHORTCUT_ID,
} from "@follow/shared/settings/defaults"
import type { AIShortcut, AIShortcutTarget } from "@follow/shared/settings/interface"
import { DEFAULT_SHORTCUT_TARGETS } from "@follow/shared/settings/interface"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

interface ShortcutModalContentProps {
  shortcut?: AIShortcut | null
  onSave: (shortcut: Omit<AIShortcut, "id">) => void
  onCancel: () => void
}

export const ShortcutModalContent = ({ shortcut, onSave, onCancel }: ShortcutModalContentProps) => {
  const { t } = useTranslation("ai")
  const [name, setName] = useState(shortcut?.name || "")
  const isDefaultSummarize = shortcut?.id === DEFAULT_SUMMARIZE_TIMELINE_SHORTCUT_ID
  const resolvedPrompt = useMemo(() => {
    if (isDefaultSummarize) {
      return shortcut?.prompt?.trim() || DEFAULT_SUMMARIZE_TIMELINE_PROMPT
    }
    return shortcut?.prompt || ""
  }, [isDefaultSummarize, shortcut?.prompt])
  const [prompt, setPrompt] = useState(resolvedPrompt)
  const [enabled, setEnabled] = useState(shortcut?.enabled ?? true)
  const initialTargets = useMemo<AIShortcutTarget[]>(() => {
    if (shortcut?.displayTargets && shortcut.displayTargets.length > 0) {
      return [...shortcut.displayTargets]
    }
    return [...DEFAULT_SHORTCUT_TARGETS]
  }, [shortcut?.displayTargets])
  const [displayTargets, setDisplayTargets] = useState<AIShortcutTarget[]>(initialTargets)

  useEffect(() => {
    setDisplayTargets(initialTargets)
  }, [initialTargets])

  useEffect(() => {
    setPrompt(resolvedPrompt)
  }, [resolvedPrompt])

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
    const finalPrompt =
      trimmedPrompt || (isDefaultSummarize ? DEFAULT_SUMMARIZE_TIMELINE_PROMPT : "")

    if (!trimmedName || !finalPrompt) {
      toast.error(t("shortcuts.validation.required"))
      return
    }
    if (displayTargets.length === 0) {
      toast.error(t("shortcuts.validation.targets_required"))
      return
    }

    onSave({
      name: trimmedName,
      prompt: finalPrompt,
      enabled,
      displayTargets,
    })
  }

  return (
    <div className="w-[400px] space-y-4">
      <div className="grid grid-cols-6 gap-4">
        <div className="col-span-6 space-y-2">
          <Label className="text-text text-xs">{t("shortcuts.name")}</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("shortcuts.name_placeholder")}
          />
        </div>
        {/* <div className="col-span-2 space-y-2">
          <Label className="text-text text-xs">{t("shortcuts.hotkey")}</Label>
          <button
            type="button"
            className="border-border hover:bg-material-medium flex h-9 w-full items-center rounded-md border bg-transparent px-3 py-2 text-sm transition-colors focus:outline-none"
            onClick={() => setIsRecording(!isRecording)}
          >
            {isRecording ? (
              <KeyRecorder
                onBlur={() => setIsRecording(false)}
                onChange={(keys) => {
                  setHotkey(Array.isArray(keys) ? keys.join("+") : "")
                  setIsRecording(false)
                }}
              />
            ) : (
              <div className="flex w-full items-center justify-center">
                <div className="flex items-center justify-center gap-2">
                  {hotkey ? (
                    <KbdCombined kbdProps={{ wrapButton: false }} joint={false}>
                      {hotkey}
                    </KbdCombined>
                  ) : (
                    <span className="text-text-tertiary text-xs">Click to record</span>
                  )}
                </div>
              </div>
            )}
          </button>
        </div> */}
      </div>

      <div className="space-y-2">
        <Label className="text-text text-xs">{t("shortcuts.prompt")}</Label>
        <TextArea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t("shortcuts.prompt_placeholder")}
          className="min-h-[60px] resize-none p-2 px-3 text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-text text-xs">{t("shortcuts.targets.label")}</Label>
        <div className="text-text-secondary flex flex-wrap gap-3 text-xs">
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
        <p className="text-text-tertiary text-xs">{t("shortcuts.targets.help")}</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch size="sm" checked={enabled} onCheckedChange={setEnabled} />
          <Label className="text-text text-xs">{t("shortcuts.enabled")}</Label>
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
