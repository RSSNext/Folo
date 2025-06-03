import { useRouteParamsSelector } from "./useRouteParams"

export function useEntryIsRead(read: Nullable<boolean>) {
  return useRouteParamsSelector(
    (params) => {
      if (params.isCollection) {
        return true
      }
      if (!read) return false
      return read
    },
    [read],
  )
}
