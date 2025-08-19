import { useEntry } from "@follow/store/entry/hooks"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

interface QuickAction {
  id: string
  label: string
  prompt: string
  icon: string
  priority: number
}

const DEFAULT_ENTRY_ACTIONS: QuickAction[] = [
  {
    id: "analyze",
    label: "Analyze this entry",
    prompt: "Can you analyze this entry and tell me what it's about?",
    icon: "i-mgc-search-cute-re",
    priority: 1,
  },
  {
    id: "explain",
    label: "Explain key points",
    prompt: "What are the key points I should understand from this entry?",
    icon: "i-mgc-lightbulb-cute-re",
    priority: 2,
  },
]

/**
 * Hook to generate contextual conversation starters based on summary content and entry metadata.
 * Returns an array of quick actions that provide intelligent prompts for starting AI conversations.
 */
export const useSmartQuickActions = (
  summaryData: string | null,
  entryId: string,
): QuickAction[] => {
  const entry = useEntry(entryId, (state) => ({ url: state.url }))
  const { t } = useTranslation("ai")

  return useMemo(() => {
    if (!summaryData || !entry) return DEFAULT_ENTRY_ACTIONS

    const actions: QuickAction[] = []

    // Content-based actions
    if (summaryData.length > 500) {
      actions.push({
        id: "simplify",
        label: t("quick_actions.simplify") || "Simplify this",
        prompt: `Can you simplify this summary in 2-3 sentences? Focus on the main points.`,
        icon: "i-mgc-edit-cute-re",
        priority: 1,
      })
    }

    // Entry type-based actions
    if (entry.url) {
      actions.push({
        id: "discuss",
        label: t("quick_actions.discuss") || "Discuss insights",
        prompt: `What are the key insights from this article? What should I know?`,
        icon: "i-mgc-chat-cute-re",
        priority: 2,
      })
    }

    // Always available actions
    actions.push(
      {
        id: "questions",
        label: t("quick_actions.questions") || "Ask questions",
        prompt: `What questions should I be asking about this content?`,
        icon: "i-mgc-question-cute-re",
        priority: 3,
      },
      {
        id: "takeaways",
        label: t("quick_actions.takeaways") || "Key takeaways",
        prompt: `What are the most important takeaways from this entry?`,
        icon: "i-mgc-star-cute-re",
        priority: 4,
      },
    )

    return actions.sort((a, b) => a.priority - b.priority).slice(0, 4)
  }, [summaryData, entry, t])
}
