import type { InboxModel } from "@follow/models/types"

type InboxId = string

export interface InboxState {
  inboxes: Record<InboxId, InboxModel>
}
