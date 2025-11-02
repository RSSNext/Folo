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
      stepV2: step,
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

  const renderContent = () => {
    switch (step) {
      case "intro":
      case "selecting-feeds": {
        return (
          <div className="grid h-screen w-screen grid-cols-1 divide-x overflow-hidden p-5 lg:grid-cols-10">
            <FeedsSelectionList />
            <AIChatPane />
          </div>
        )
      }
      case "manual-import": {
        return <DiscoverImportStep />
      }
      case "pre-finish":
      case "manual-import-pre-finish": {
        return <PreFinish />
      }
      case "finish":
      case "manual-import-finish": {
        return null
      }
      default: {
        return null
      }
    }
  }

  return (
    <AIChatRoot>
      <div className="flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-theme-background">
        <div className="mx-auto flex flex-col gap-8">{renderContent()}</div>
      </div>
    </AIChatRoot>
  )
}
