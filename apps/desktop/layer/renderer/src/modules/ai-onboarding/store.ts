import type { MediaModel } from "@follow/database/schemas/types"
import type { FeedViewType } from "@follow-app/client-sdk"
import { atom } from "jotai"
import { splitAtom } from "jotai/utils"

import { jotaiStore } from "~/lib/jotai"

export const stepAtom = atom<"intro" | "selecting-feeds" | "finish">("intro")

export type FeedSelection = {
  description: string | null
  id: string
  image: string | null
  title: string | null
  url: string
  selected?: boolean

  entries: {
    description: string | null
    id: string
    media: MediaModel[] | null
    publishedAt: Date
    title: string | null
    url: string | null
  }[]

  analytics: {
    view: FeedViewType | null
  }
}

export const feedSelectionsAtom = atom<FeedSelection[]>([])

export const feedSelectionAtomsAtom = splitAtom(feedSelectionsAtom)

export const selectedFeedSelectionAtomsAtom = atom((get) =>
  get(feedSelectionAtomsAtom).filter((a) => get(a).selected),
)

/**
 * The atoms outlive the modal, so every launch has to start from the intro with an empty
 * selection. Otherwise a finished onboarding closes again as soon as it opens.
 */
export const resetAiOnboarding = () => {
  jotaiStore.set(stepAtom, "intro")
  jotaiStore.set(feedSelectionsAtom, [])
}
