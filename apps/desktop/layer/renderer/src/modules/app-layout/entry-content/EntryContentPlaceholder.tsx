import { AnimatePresence, LayoutGroup, m } from "motion/react"

import { useSummarizeTimeline } from "~/modules/ai-chat/hooks/useSummarizeTimeline"
import { EntryPlaceholderLogo } from "~/modules/entry-content/components/EntryPlaceholderLogo"

export const EntryContentPlaceholder = () => {
  const { summarizeTimeline } = useSummarizeTimeline()

  return (
    <LayoutGroup>
      <AnimatePresence>
        <m.div
          className="center size-full flex-col"
          initial={{ opacity: 0.01, y: 300 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <EntryPlaceholderLogo onAskAI={summarizeTimeline} />
        </m.div>
      </AnimatePresence>
    </LayoutGroup>
  )
}
