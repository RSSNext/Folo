import type { UniqueIdentifier } from "@dnd-kit/core"

import { COMMAND_ID } from "../command/commands/id"

export interface ToolbarActionOrder {
  main: UniqueIdentifier[]
  more: UniqueIdentifier[]
}

const entryItemInMore = new Set<string>([
  COMMAND_ID.entry.copyLink,
  COMMAND_ID.entry.openInBrowser,
  COMMAND_ID.entry.exportAsPDF,
  COMMAND_ID.entry.read,
])

export const DEFAULT_ACTION_ORDER: ToolbarActionOrder = {
  main: Object.values(COMMAND_ID.entry).filter((id) => !entryItemInMore.has(id)),
  more: [
    ...Object.values(COMMAND_ID.integration),
    ...Object.values(COMMAND_ID.entry).filter((id) => entryItemInMore.has(id)),
  ],
}
