import { useInboxStore } from "./store"

export const useInbox = (inboxId: string) => {
  return useInboxStore((state) => {
    return state.inboxes[inboxId]
  })
}
