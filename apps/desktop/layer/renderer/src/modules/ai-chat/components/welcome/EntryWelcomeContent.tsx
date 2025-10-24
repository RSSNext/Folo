import { m } from "motion/react"

import { EntrySummaryCard } from "./EntrySummaryCard"

interface EntryWelcomeContentProps {
  entryId: string
}

export const EntryWelcomeContent: React.FC<EntryWelcomeContentProps> = ({ entryId }) => (
  <div className="flex w-full flex-col items-center gap-6">
    <m.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      className="w-full max-w-2xl"
    >
      <EntrySummaryCard entryId={entryId} />
    </m.div>
  </div>
)
