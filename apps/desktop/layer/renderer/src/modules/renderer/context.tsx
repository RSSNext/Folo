import { FeedViewType } from "@follow/constants"
import { createContext as createReactContext } from "react"
import { createContext } from "use-context-selector"

export interface EntryContentContext {
  entryId: string
  feedId: string

  audioSrc?: string

  view: FeedViewType
}
const defaultContextValue: EntryContentContext = {
  entryId: "",
  feedId: "",
  view: FeedViewType.Articles,
}
export const EntryContentContext = createContext<EntryContentContext>(defaultContextValue)

export const EntryContentProvider: Component<EntryContentContext> = ({ children, ...value }) => (
  <EntryContentContext.Provider value={value}>{children}</EntryContentContext.Provider>
)

export interface EntryInfoContext {
  feedId: string
  entryId: string
}
const defaultInfoContextValue: EntryInfoContext = {
  feedId: "",
  entryId: "",
}
export const EntryInfoContext = createReactContext<EntryInfoContext>(defaultInfoContextValue)
