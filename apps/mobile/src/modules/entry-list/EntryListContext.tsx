import type { FeedViewType } from "@follow/constants"
import { createContext, use } from "react"

export const EntryListContextViewContext = createContext<FeedViewType>(null!)

export const useEntryListContextView = () => {
  return use(EntryListContextViewContext)
}
