import { getReadonlyRoute } from "@follow/components/atoms/route.js"
import { DEFAULT_SUMMARIZE_TIMELINE_SHORTCUT_ID } from "@follow/shared/settings/defaults"
import type { AIShortcut } from "@follow/shared/settings/interface"
import { DEFAULT_SHORTCUT_TARGETS } from "@follow/shared/settings/interface"
import { cn } from "@follow/utils"
import type { TFunction } from "i18next"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { MenuItemText, useShowContextMenu } from "~/atoms/context-menu"
import { getAISettings, setAISetting, useAISettingValue } from "~/atoms/settings/ai"
import { useContextMenu } from "~/hooks/common/useContextMenu"
import {
  useCreateAIShortcutModal,
  useEditAIShortcutModal,
} from "~/modules/settings/tabs/ai/shortcuts/hooks"

import type { ShortcutData } from "../../editor/plugins/shortcut/types"
import { useMainEntryId } from "../../hooks/useMainEntryId"
import { AIShortcutButton } from "../ui/AIShortcutButton"
import { ShortcutTooltip } from "../ui/ShortcutTooltip"

interface ChatShortcutsRowProps {
  onSelect: (shortcutData: ShortcutData) => void
}

export const ChatShortcutsRow: React.FC<ChatShortcutsRowProps> = ({ onSelect }) => {
  const { t } = useTranslation("ai")
  const aiSettings = useAISettingValue()
  const mainEntryId = useMainEntryId()
  const isAiPage = useMemo(() => getReadonlyRoute().location.pathname === "/ai", [])

  const shortcutsToDisplay = useMemo(() => {
    const shortcuts = aiSettings.shortcuts ?? []
    const list: typeof shortcuts = []
    const entry: typeof shortcuts = []
    const aiPage: typeof shortcuts = []
    for (const shortcut of shortcuts) {
      if (!shortcut.enabled) continue
      const targets =
        shortcut.displayTargets && shortcut.displayTargets.length > 0
          ? shortcut.displayTargets
          : DEFAULT_SHORTCUT_TARGETS
      if (targets.includes("list")) {
        list.push(shortcut)
      }
      if (targets.includes("entry")) {
        entry.push(shortcut)
      }
      aiPage.push(shortcut)
    }

    if (mainEntryId) {
      return entry
    }
    if (isAiPage) {
      return aiPage
    }
    return list
  }, [aiSettings.shortcuts, mainEntryId, isAiPage])

  const handleAddShortcut = useCreateAIShortcutModal()
  const handleEditShortcut = useEditAIShortcutModal()

  const handleDisableShortcut = useCallback((shortcutId: string) => {
    const { shortcuts = [] } = getAISettings()
    setAISetting(
      "shortcuts",
      shortcuts.map((shortcut) =>
        shortcut.id === shortcutId ? { ...shortcut, enabled: false } : shortcut,
      ),
    )
  }, [])

  const handleDeleteShortcut = useCallback(
    (shortcutId: string) => {
      const { shortcuts = [] } = getAISettings()
      setAISetting(
        "shortcuts",
        shortcuts.filter((shortcut) => shortcut.id !== shortcutId),
      )
      toast.success(t("shortcuts.deleted"))
    },
    [t],
  )

  const handleCustomize = useCallback(() => {
    handleAddShortcut()
  }, [handleAddShortcut])

  return (
    <div className="mb-3 px-1">
      <div className="flex flex-nowrap items-center gap-2 overflow-x-auto py-1">
        <AIShortcutButton
          className={cn(shortcutsToDisplay.length > 0 ? "aspect-square rounded-full p-2" : "")}
          onClick={handleCustomize}
          animationDelay={0}
          size="sm"
          title={t("new_shortcuts")}
        >
          <i className="i-mgc-add-cute-re" />
          <span className={shortcutsToDisplay.length > 0 ? "sr-only" : "text-text"}>
            {t("new_shortcuts")}
          </span>
        </AIShortcutButton>
        {shortcutsToDisplay.map((shortcut) => (
          <ShortcutMenuButton
            key={shortcut.id}
            shortcut={shortcut}
            onSelect={onSelect}
            onEdit={handleEditShortcut}
            onDisable={handleDisableShortcut}
            onDelete={handleDeleteShortcut}
            t={t}
          />
        ))}
      </div>
    </div>
  )
}

interface ShortcutMenuButtonProps {
  shortcut: AIShortcut
  onSelect: (shortcutData: ShortcutData) => void
  onEdit: (shortcut: AIShortcut) => void
  onDisable: (shortcutId: string) => void
  onDelete: (shortcutId: string) => void
  t: TFunction<"ai">
}

const ShortcutMenuButton: React.FC<ShortcutMenuButtonProps> = ({
  shortcut,
  onSelect,
  onEdit,
  onDisable,
  onDelete,
  t,
}) => {
  const showContextMenu = useShowContextMenu()
  const contextMenuProps = useContextMenu({
    onContextMenu: async (event) => {
      event.preventDefault()
      event.stopPropagation()

      const isProtected =
        !!shortcut.defaultPrompt || shortcut.id === DEFAULT_SUMMARIZE_TIMELINE_SHORTCUT_ID

      await showContextMenu(
        [
          new MenuItemText({
            label: t("shortcuts.actions.edit"),
            click: () => onEdit(shortcut),
          }),
          new MenuItemText({
            label: t("shortcuts.actions.disable"),
            click: () => onDisable(shortcut.id),
          }),
          !isProtected
            ? new MenuItemText({
                label: t("shortcuts.actions.delete"),
                click: () => onDelete(shortcut.id),
              })
            : null,
        ],
        event,
      )
    },
  })

  return (
    <div {...contextMenuProps}>
      <ShortcutTooltip
        asChild={false}
        name={shortcut.name}
        prompt={shortcut.prompt || shortcut.defaultPrompt}
        hotkey={shortcut.hotkey}
      >
        <AIShortcutButton onClick={() => onSelect(shortcut)} animationDelay={0} size="sm">
          <span className="flex items-center gap-1">
            {shortcut.icon ? (
              <i className={shortcut.icon} />
            ) : (
              <i className="i-mgc-hotkey-cute-re" />
            )}
            <span>{shortcut.name}</span>
          </span>
        </AIShortcutButton>
      </ShortcutTooltip>
    </div>
  )
}
