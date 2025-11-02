import type { MediaModel } from "@follow/database/schemas/types"
import type { FeedViewType } from "@follow-app/client-sdk"
import { atom } from "jotai"
import { splitAtom } from "jotai/utils"

export const stepAtom = atom<
  | "intro"
  | "selecting-feeds"
  | "pre-finish"
  | "finish"
  | "manual-import"
  | "manual-import-pre-finish"
  | "manual-import-finish"
>("intro")

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
