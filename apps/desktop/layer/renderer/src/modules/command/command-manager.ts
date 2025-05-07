import { useRegisterEntryCommands } from "./commands/entry"
import { useRegisterIntegrationCommands } from "./commands/integration"
import { useRegisterListCommands } from "./commands/list"
import { useRegisterSettingsCommands } from "./commands/settings"

export function useRegisterFollowCommands() {
  useRegisterSettingsCommands()
  useRegisterListCommands()
  useRegisterEntryCommands()
  useRegisterIntegrationCommands()
}

export const FollowCommandManager = () => {
  useRegisterFollowCommands()
  return null
}
