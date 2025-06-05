import type { FeedViewType } from "@follow/constants"

import type { FeedModel } from "./types"

export type RSSHubRouteType = Record<string, RSSHubRouteDeclaration>
export interface RSSHubRouteDeclaration {
  routes: Routes
  name: string
  url: string
}
type Routes = Record<string, RSSHubRoute>
export type RSSHubParameterObject = {
  description: string
  default: string | null
  options?: {
    label: string
    value: string
  }[]
}

export type RSSHubParameter = string | RSSHubParameterObject
export type RSSHubRoute = {
  path: string
  categories: string[]
  example: string
  parameters: Record<string, RSSHubParameter>
  name: string
  maintainers: string[]
  location: string
  description: string
  view?: FeedViewType
  heat?: number
  topFeeds?: FeedModel[]
}
