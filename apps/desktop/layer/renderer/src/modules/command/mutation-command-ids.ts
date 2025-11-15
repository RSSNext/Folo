import { COMMAND_ID } from "./commands/id"
import type { FollowCommandId } from "./types"

const MUTATION_COMMAND_IDS = new Set<FollowCommandId>([
  COMMAND_ID.entry.star,
  COMMAND_ID.entry.toggleAITranslation,
  COMMAND_ID.entry.read,
  COMMAND_ID.entry.readAbove,
  COMMAND_ID.entry.readBelow,
  COMMAND_ID.entry.delete,
  COMMAND_ID.entry.readability,
  COMMAND_ID.integration.saveToEagle,
  COMMAND_ID.integration.saveToReadwise,
  COMMAND_ID.integration.saveToInstapaper,
  COMMAND_ID.integration.saveToObsidian,
  COMMAND_ID.integration.saveToOutline,
  COMMAND_ID.integration.saveToReadeck,
  COMMAND_ID.integration.saveToCubox,
  COMMAND_ID.integration.saveToZotero,
  COMMAND_ID.integration.saveToQBittorrent,
  COMMAND_ID.integration.custom,
])

const MUTATION_PREFIXES = ["integration:custom:"]

export const isMutationCommandId = (id: string | undefined) => {
  if (!id) return false
  if (MUTATION_COMMAND_IDS.has(id as FollowCommandId)) {
    return true
  }
  return MUTATION_PREFIXES.some((prefix) => id.startsWith(prefix))
}
