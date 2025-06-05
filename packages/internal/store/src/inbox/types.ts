import type { InboxSchema } from "@follow/database/schemas/types"

export type InboxModel = InboxSchema & {
  type: "inbox"
}
