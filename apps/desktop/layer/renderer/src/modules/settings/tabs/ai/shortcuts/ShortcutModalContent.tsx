import { Button } from "@follow/components/ui/button/index.js"
import { Input, TextArea } from "@follow/components/ui/input/index.js"
import { Label } from "@follow/components/ui/label/index.jsx"
import { Switch } from "@follow/components/ui/switch/index.jsx"
import type { AIShortcut } from "@follow/shared/settings/interface"
import { useState } from "react"
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
  const [prompt, setPrompt] = useState(shortcut?.prompt || "")
  const [enabled, setEnabled] = useState(shortcut?.enabled ?? true)

  const handleSave = () => {
    if (!name.trim() || !prompt.trim()) {
      toast.error(t("shortcuts.validation.required"))
      return
    }

    onSave({
      name: name.trim(),
      prompt: prompt.trim(),
      enabled,
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
          className="min-h-[60px] resize-none text-sm"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch checked={enabled} onCheckedChange={setEnabled} />
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
