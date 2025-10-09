import { tracker } from "@follow/tracker"
import { useAtomValue } from "jotai"
import { useEffect } from "react"

import { AIChatRoot } from "~/modules/ai-chat/components/layouts/AIChatRoot"

import { settingSyncQueue } from "../settings/helper/sync-queue"
import { AIChatPane } from "./ai-chat-pane"
import { DiscoverImportStep } from "./discover-import-step"
import { FeedsSelectionList } from "./feeds-selection-list"
import { PreFinish } from "./pre-finish"
import { stepAtom } from "./store"

export function GuideModalContent({ onClose }: { onClose: () => void }) {
  const step = useAtomValue(stepAtom)

  useEffect(() => {
    tracker.onBoarding({
      step,
      done: step === "finish",
    })
  }, [step])

  useEffect(() => {
    if (step !== "finish") {
      return
    }

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

  return (
    <AIChatRoot>
      <div className="bg-theme-background flex h-screen w-screen flex-col items-center justify-center overflow-hidden">
        <div className="mx-auto flex flex-col gap-8">
          {step === "manual-import" ? (
            <DiscoverImportStep />
          ) : step === "intro" || step === "selecting-feeds" ? (
            <div className="grid h-screen w-screen grid-cols-1 divide-x overflow-hidden p-5 lg:grid-cols-10">
              <FeedsSelectionList />
              <AIChatPane />
            </div>
          ) : step === "pre-finish" ? (
            <PreFinish />
          ) : null}
        </div>
      </div>
    </AIChatRoot>
  )
}
