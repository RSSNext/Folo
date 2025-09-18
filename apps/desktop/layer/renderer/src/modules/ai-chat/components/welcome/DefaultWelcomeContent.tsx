import { AIShortcutButton } from "@follow/components/ui/ai-shortcut-button/index.js"
import type { EditorState, LexicalEditor } from "lexical"
import { m } from "motion/react"
import { useTranslation } from "react-i18next"

import { useSettingModal } from "~/modules/settings/modal/use-setting-modal-hack"

interface DefaultWelcomeContentProps {
  onSend: (message: EditorState | string, editor: LexicalEditor | null) => void
  shortcuts: Array<{ id: string; name: string; prompt: string; enabled: boolean; hotkey?: string }>
}

export const DefaultWelcomeContent: React.FC<DefaultWelcomeContentProps> = ({
  onSend,
  shortcuts: enabledShortcuts,
}) => {
  const { t } = useTranslation("ai")
  const showSettings = useSettingModal()
  return (
    <m.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      className="w-full space-y-8"
    >
      <div className="relative flex flex-wrap items-center justify-center gap-2">
        {/* Custom shortcuts first */}
        {enabledShortcuts.slice(0, 6).map((shortcut, index) => (
          <AIShortcutButton
            key={shortcut.id}
            onClick={() => onSend(shortcut.prompt, null)}
            animationDelay={index * 0.1}
            title={shortcut.hotkey ? `${shortcut.name} (${shortcut.hotkey})` : shortcut.name}
          >
            {shortcut.name}
          </AIShortcutButton>
        ))}

        {/* Show customize button when no shortcuts are available */}
        {enabledShortcuts.length === 0 && (
          <>
            <AIShortcutButton
              key="customize-shortcuts"
              onClick={() => showSettings("ai")}
              animationDelay={0}
              variant="outline"
              title={t("customize_shortcuts_title")}
            >
              {t("customize_shortcuts")}
            </AIShortcutButton>
          </>
        )}
      </div>
    </m.div>
  )
}
