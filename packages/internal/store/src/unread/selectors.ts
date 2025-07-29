import type { UnreadState } from "./types"

export const unreadCountIdSelector = (id: string) => {
  return (state: UnreadState) => state.data[id] ?? 0
}

export const unreadCountIdsSelector = (ids: string[]) => {
  return (state: UnreadState) => {
    if (!ids || ids.length === 0) return 0

    let count = 0
    for (const id of ids) {
      count += state.data[id] ?? 0
    }
    return count
  }
}

export const unreadCountAllSelector = (state: UnreadState) => {
  return Object.values(state.data).reduce((acc, unread) => acc + unread, 0)
}
