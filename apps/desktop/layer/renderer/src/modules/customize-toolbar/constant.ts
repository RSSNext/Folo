import type { UniqueIdentifier } from "@dnd-kit/core"

import { COMMAND_ID } from "../command/commands/id"

export interface ToolbarActionOrder {
  main: UniqueIdentifier[]
  more: UniqueIdentifier[]
}

export const ENTRY_ITEM_HIDE_IN_HEADER = new Set<UniqueIdentifier>([
  COMMAND_ID.entry.readAbove,
  COMMAND_ID.entry.readBelow,
])

const MAIN_ACTIONS = [
  COMMAND_ID.entry.read,
  COMMAND_ID.entry.star,

  COMMAND_ID.entry.toggleAISummary,
  COMMAND_ID.entry.readability,

  COMMAND_ID.entry.viewSourceContent,
  COMMAND_ID.entry.share,
]
const MAIN_ACTIONS_SET = new Set<UniqueIdentifier>(MAIN_ACTIONS)

export const DEFAULT_ACTION_ORDER: ToolbarActionOrder = {
  main: MAIN_ACTIONS,
  more: [
    ...Object.values(COMMAND_ID.integration),
    ...Object.values(COMMAND_ID.entry).filter((id) => !MAIN_ACTIONS_SET.has(id)),
    COMMAND_ID.settings.customizeToolbar,
  ],
}
