import type { InboxModel } from "@follow/models/types"

import { useInboxStore } from "./store"

export function useInboxById(inboxId: Nullable<string>): InboxModel | null
export function useInboxById<T>(
  inboxId: Nullable<string>,
  selector: (inbox: InboxModel | null) => T,
): T

export function useInboxById<T>(inboxId: Nullable<string>, selector?: (inbox: InboxModel) => T) {
  return useInboxStore((state) =>
    inboxId ? (selector ? selector(state.inboxes[inboxId]!) : state.inboxes[inboxId]) : null,
  )
}
