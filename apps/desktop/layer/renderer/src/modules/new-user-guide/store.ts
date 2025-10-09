import type { MediaModel } from "@follow/database/schemas/types"
import { atom } from "jotai"
import { splitAtom } from "jotai/utils"

export const stepAtom = atom<
  "intro" | "selecting-feeds" | "manual-import" | "pre-finish" | "finish"
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
}

export const feedSelectionsAtom = atom<FeedSelection[]>([])

export const feedSelectionAtomsAtom = splitAtom(feedSelectionsAtom)

export const selectedFeedSelectionAtomsAtom = atom((get) =>
  get(feedSelectionAtomsAtom).filter((a) => get(a).selected),
)
