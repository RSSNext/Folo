import type { FeedViewType } from "@follow/constants"
import { createContext } from "react"

// TODO: remove this context
const ViewPageCurrentViewContext = createContext<FeedViewType>(null!)
export const ViewPageCurrentViewProvider = ViewPageCurrentViewContext.Provider
export const GroupedContext = createContext<string | null>(null)
