import { useInboxStore } from "./store"

export const useIsInbox = (inboxId?: string) => {
  return useInboxStore((state) => {
    if (!inboxId) return false
    return !!state.inboxes[inboxId]
  })
}

export const useInboxById = (inboxId?: string) => {
  return useInboxStore((state) => {
    if (!inboxId) return
    return state.inboxes[inboxId]
  })
}

export const useInboxList = () => {
  return useInboxStore((state) => {
    return Object.values(state.inboxes)
  })
}
