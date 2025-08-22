import { useInboxStore } from "./store"
import type { InboxModel } from "./types"

export const useIsInbox = (inboxId: string | null | undefined) => {
  return useInboxStore((state) => {
    if (!inboxId) return false
    return !!state.inboxes[inboxId]
  })
}

export const useInboxById = (inboxId: string | null | undefined) => {
  return useInboxStore((state) => {
    if (!inboxId) return
    return state.inboxes[inboxId]
  })
}

export function useInboxList(): InboxModel[]
export function useInboxList<T>(selector: (inboxes: InboxModel[]) => T): T
export function useInboxList<T>(selector?: (inboxes: InboxModel[]) => T) {
  return useInboxStore((state) => {
    const inboxes = Object.values(state.inboxes)
    return selector ? selector(inboxes) : inboxes
  })
}
