import "./AITimelineLoadingOverlay.css"

import { Spring } from "@follow/components/constants/spring.js"
import { AnimatePresence, m } from "motion/react"
import type { FC } from "react"

type Props = {
  visible: boolean
  label: string
}

export const AITimelineLoadingOverlay: FC<Props> = ({ visible, label }) => (
  <AnimatePresence>
    {visible ? (
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={Spring.presets.smooth}
        className="ai-timeline-loading"
      >
        <div className="ai-timeline-loading__backdrop" />
        <div className="ai-timeline-loading__glow" />
        <div className="ai-timeline-loading__beam ai-timeline-loading__beam--left" />
        <div className="ai-timeline-loading__beam ai-timeline-loading__beam--right" />
        <div className="ai-timeline-loading__sparkles">
          <span />
          <span />
          <span />
        </div>

        <div className="ai-timeline-loading__badge flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-text">
          <span className="inline-flex size-2 rounded-full bg-orange-400 shadow-[0_0_12px_rgba(251,146,60,0.7)]" />
          <span className="i-mgc-robot-2-cute-re text-base text-orange-400 dark:text-orange-300" />
          <span>{label}</span>
        </div>
      </m.div>
    ) : null}
  </AnimatePresence>
)
