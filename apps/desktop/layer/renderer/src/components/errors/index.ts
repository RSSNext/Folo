import { lazy } from "react"

import { ErrorComponentType } from "./enum"

const ErrorFallbackMap = {
  [ErrorComponentType.Modal]: lazy(() => import("./ModalError")),
  [ErrorComponentType.Page]: lazy(() => import("./PageError")),
  [ErrorComponentType.FeedNotFound]: lazy(() => import("./FeedNotFound")),
  [ErrorComponentType.RSSHubDiscoverError]: lazy(() => import("./RSSHubError")),
}

export const getErrorFallback = (type: ErrorComponentType) => ErrorFallbackMap[type]
