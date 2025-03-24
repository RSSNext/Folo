import type { UniqueIdentifier } from "@dnd-kit/core"

import { COMMAND_ID } from "../command/commands/id"

export interface ToolbarActionOrder {
  main: UniqueIdentifier[]
  more: UniqueIdentifier[]
}

export const DEFAULT_ACTION_ORDER: ToolbarActionOrder = {
  main: Object.values(COMMAND_ID.entry)
    .filter((id) => !([COMMAND_ID.entry.read] as string[]).includes(id))
    .filter(
      (id) =>
        !([COMMAND_ID.entry.copyLink, COMMAND_ID.entry.openInBrowser] as string[]).includes(id),
    ),
  more: [
    ...Object.values(COMMAND_ID.integration),
    ...Object.values(COMMAND_ID.entry).filter((id) =>
      (
        [
          COMMAND_ID.entry.copyLink,
          COMMAND_ID.entry.openInBrowser,
          COMMAND_ID.entry.exportAsPDF,
          COMMAND_ID.entry.read,
        ] as string[]
      ).includes(id),
    ),
  ],
}
