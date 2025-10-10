import { FeedViewType } from "@follow/constants"
import { subscriptionSyncService } from "@follow/store/subscription/store"
import Spline from "@splinetool/react-spline"
import { useAtomValue, useSetAtom } from "jotai"
import { useEffect, useMemo } from "react"

import { feedSelectionsAtom, stepAtom } from "./store"

const WAIT_DURATION_MS = 5000

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function PreFinish() {
  const feedSelections = useAtomValue(feedSelectionsAtom)
  const setStep = useSetAtom(stepAtom)
  const selectedFeeds = useMemo(
    () => feedSelections.filter((feed) => feed.selected),
    [feedSelections],
  )

  useEffect(() => {
    let disposed = false

    const subscribeSelectedFeeds = async () => {
      for (const feed of selectedFeeds) {
        if (disposed) break
        const { url, id, title } = feed

        try {
          await subscriptionSyncService.subscribe({
            url,
            view: FeedViewType.All,
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
        setStep("finish")
      }
    }

    run()

    return () => {
      disposed = true
    }
  }, [selectedFeeds, setStep])

  return (
    <div className="h-[100vh] w-screen">
      <Spline scene="https://prod.spline.design/07pKu5Ohpb-J2VPw/scene.splinecode" />
    </div>
  )
}
