import type { InboxSchema } from "@follow/database/schemas/types"

export type InboxModel = InboxSchema & {
  type: "inbox"
  // for easier type checking, do not exist actually
  ownerUserId?: string
}
