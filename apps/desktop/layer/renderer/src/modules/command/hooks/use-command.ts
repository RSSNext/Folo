import { jotaiStore } from "@follow/utils/jotai"
import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import { useMemo } from "react"

import { CommandRegistry } from "../registry/registry"
import type { FollowCommandId, FollowCommandMap } from "../types"

export const hasCommand = <T extends FollowCommandId>(id: T) => {
  const commands = jotaiStore.get(CommandRegistry.atom) as FollowCommandMap
  return id in commands
}

export const getCommand = <T extends FollowCommandId>(id: T) => {
  const commands = jotaiStore.get(CommandRegistry.atom) as FollowCommandMap
  return id in commands ? commands[id] : null
}

export const useCommands = () => useAtomValue(CommandRegistry.atom)
export function useCommand<T extends FollowCommandId>(id: T): FollowCommandMap[T] | null {
  const commands = useAtomValue(
    useMemo(() => selectAtom(CommandRegistry.atom, (commands) => commands[id]), [id]),
  )
  return commands as FollowCommandMap[T] | null
}

const noop = () => {}
const runCommand = <T extends FollowCommandId>(
  id: T,
  args: Parameters<FollowCommandMap[T]["run"]>,
) => {
  const cmd = getCommand(id)

  if (!cmd) return noop
  // @ts-expect-error - The type should be discriminated
  return () => cmd.run(...args)
}
export function useRunCommandFn() {
  return runCommand
}
