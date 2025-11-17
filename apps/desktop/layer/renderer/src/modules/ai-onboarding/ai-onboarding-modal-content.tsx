import { tracker } from "@follow/tracker"
import { useAtomValue } from "jotai"
import { useEffect, useMemo } from "react"

import { AIChatRoot } from "~/modules/ai-chat/components/layouts/AIChatRoot"

import { settingSyncQueue } from "../settings/helper/sync-queue"
import { AIChatPane } from "./ai-chat-pane"
import { FeedsSelectionList } from "./feeds-selection-list"
import { stepAtom } from "./store"

export function AiOnboardingModalContent({ onClose }: { onClose: () => void }) {
  const step = useAtomValue(stepAtom)

  useEffect(() => {
    tracker.onBoarding({
      stepV2: step,
      done: step === "finish",
    })
  }, [step])

  useEffect(() => {
    if (step !== "finish") return

    const syncSettings = async () => {
      try {
        await settingSyncQueue.replaceRemote("general")
      } catch (error) {
        console.error("Failed to sync settings after onboarding", error)
      }
    }

    syncSettings()
  }, [step])

  useEffect(() => {
    if (step === "finish") {
      onClose()
    }
  }, [onClose, step])

  const content = useMemo(() => {
    switch (step) {
      case "intro":
      case "selecting-feeds": {
        return (
          <div className="relative flex size-full flex-col overflow-hidden lg:flex-row">
            {/* Left side - Feed Selection (45% width on large screens) */}
            <div className="overflow-hidden lg:w-2/5">
              <FeedsSelectionList />
            </div>

            {/* Gradient divider */}
            <div
              className="hidden w-px flex-shrink-0 lg:block"
              style={{
                background:
                  "linear-gradient(to bottom, transparent, rgba(255, 92, 0, 0.2), transparent)",
              }}
            />

            {/* Right side - AI Chat (55% width on large screens) */}
            <div className="flex-1 overflow-hidden lg:w-[55%]">
              <AIChatPane />
            </div>
          </div>
        )
      }

      default: {
        return null
      }
    }
  }, [step])

  if (!content) return null

  return (
    <AIChatRoot>
      <div className="absolute inset-8 flex flex-col overflow-hidden rounded-xl bg-background">
        {content}
      </div>
    </AIChatRoot>
  )
}
