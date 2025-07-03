import { useInboxStore } from "./store"

export function getInboxList() {
  return Object.values(useInboxStore.getState().inboxes)
}
