import { useRouteParamsSelector } from "./useRouteParams"

export function useEntryIsRead<T extends { read: Nullable<boolean> }>(entry?: T | null) {
  return useRouteParamsSelector(
    (params) => {
      if (params.isCollection) {
        return true
      }
      if (!entry) return false
      return entry.read
    },
    [entry?.read],
  )
}
