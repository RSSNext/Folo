import { Progress } from "@follow/components/ui/progress/index.js"
import { FeedViewType } from "@follow/constants"
import { subscriptionSyncService } from "@follow/store/subscription/store"
import Spline from "@splinetool/react-spline"
import { useAtom, useAtomValue } from "jotai"
import { useEffect, useMemo, useState } from "react"

import { feedSelectionsAtom, stepAtom } from "./store"

const WAIT_DURATION_MS = 5000

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function PreFinish() {
  const feedSelections = useAtomValue(feedSelectionsAtom)
  const [step, setStep] = useAtom(stepAtom)
  const selectedFeeds = useMemo(
    () => feedSelections.filter((feed) => feed.selected),
    [feedSelections],
  )
  const [progress, setProgress] = useState(selectedFeeds.length === 0 ? 100 : 0)
  const [showProgress, setShowProgress] = useState(false)

  useEffect(() => {
    setProgress(selectedFeeds.length === 0 ? 100 : 0)
    setShowProgress(false)

    const timer = window.setTimeout(() => setShowProgress(true), WAIT_DURATION_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [selectedFeeds])

  useEffect(() => {
    let disposed = false

    const subscribeSelectedFeeds = async () => {
      if (selectedFeeds.length === 0) {
        if (!disposed) {
          setProgress(100)
        }
        return
      }

      let completed = 0

      for (const feed of selectedFeeds) {
        if (disposed) break
        const { url, id, title } = feed

        try {
          await subscriptionSyncService.subscribe({
            url,
            view: feed.analytics.view ?? FeedViewType.Articles,
            category: null,
            isPrivate: false,
            hideFromTimeline: null,
            title: title ?? null,
            feedId: id,
            listId: undefined,
          })
        } catch (error) {
          if (!disposed) {
            console.error("Failed to subscribe feed during onboarding", { feedId: id, error })
          }
        } finally {
          completed += 1
          if (!disposed) {
            setProgress(Math.round((completed / selectedFeeds.length) * 100))
          }
        }
      }
    }

    const run = async () => {
      const tasks: Promise<unknown>[] = [sleep(WAIT_DURATION_MS)]
      if (selectedFeeds.length > 0) {
        tasks.push(subscribeSelectedFeeds())
      }
      await Promise.allSettled(tasks)

      if (!disposed) {
        if (step === "manual-import-pre-finish") {
          setStep("manual-import-finish")
        } else {
          setStep("finish")
        }
      }
    }

    run()

    return () => {
      disposed = true
    }
  }, [selectedFeeds, setStep, step])

  return (
    <div className="relative h-[100vh] w-screen">
      {showProgress ? (
        <div className="pointer-events-none absolute bottom-12 left-1/2 flex w-full -translate-x-1/2 justify-center px-6">
          <Progress value={progress} max={100} aria-label="Subscription progress" />
        </div>
      ) : null}
      <Spline scene="https://prod.spline.design/07pKu5Ohpb-J2VPw/scene.splinecode" />
    </div>
  )
}
