import { useEffect } from "react"
import { useTranslation } from "react-i18next"

import { registerCommand } from "../registry/registry"
import type { CommandOptions, FollowCommandId, FollowCommandMap } from "../types"

export type RegisterOptions = {
  deps?: unknown[]
  enabled?: boolean
  // forceMountSection?: boolean
  // sectionMeta?: Record<string, unknown>
  // orderSection?: OrderSectionInstruction
  // orderCommands?: OrderCommandsInstruction
}

export const useRegisterCommandEffect = (
  options: CommandOptions | CommandOptions[],
  registerOptions?: RegisterOptions,
) => {
  const { t } = useTranslation()
  useEffect(() => {
    if (!Array.isArray(options)) {
      const unsubscribe = registerCommand(options)
      return () => unsubscribe()
    }

    const unsubscribes = options.map((option) => registerCommand(option))
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we want to run this effect only once
  }, [t, ...(registerOptions?.deps ?? [])])
}

/**
 * Register a follow command.
 */
export function useRegisterFollowCommand<T extends FollowCommandId>(
  options: CommandOptions<{ id: T; fn: FollowCommandMap[T]["run"] }>,
  registerOptions?: RegisterOptions,
): void
/**
 * Register a unknown command.
 */
export function useRegisterFollowCommand<T extends string>(
  options: CommandOptions<{ id: T; fn: () => void }>,
  registerOptions?: RegisterOptions,
): void
/**
 * Register multiple follow commands or unknown commands.
 */
export function useRegisterFollowCommand<T extends (FollowCommandId | string)[]>(
  options: [
    ...{
      [K in keyof T]: T[K] extends FollowCommandId
        ? CommandOptions<{ id: T[K]; fn: FollowCommandMap[T[K]]["run"] }>
        : CommandOptions<{ id: T[K]; fn: () => void }>
    },
  ],
  registerOptions?: RegisterOptions,
): void
export function useRegisterFollowCommand(
  options: CommandOptions | CommandOptions[],
  registerOptions?: RegisterOptions,
) {
  return useRegisterCommandEffect(options as CommandOptions | CommandOptions[], registerOptions)
}
