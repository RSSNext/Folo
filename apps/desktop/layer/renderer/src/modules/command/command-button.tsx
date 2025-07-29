import type { ActionButtonProps } from "@follow/components/ui/button/index.js"
import { ActionButton } from "@follow/components/ui/button/index.js"

import { useCommand } from "./hooks/use-command"
import type { FollowCommand, FollowCommandId, FollowCommandMap } from "./types"

interface CommandButtonProps<T extends FollowCommand> extends ActionButtonProps {
  command: T
  args: Parameters<T["run"]>
  shortcut?: string
}

export interface CommandIdButtonProps<T extends FollowCommandId = FollowCommandId>
  extends ActionButtonProps {
  commandId: T
  args: Parameters<FollowCommandMap[T]["run"]>
  shortcut?: string
}

/**
 * @deprecated
 */
export const CommandActionButton = <T extends FollowCommand>({
  command,
  args,
  shortcut,
  ...props
}: CommandButtonProps<T>) => {
  return (
    <ActionButton
      icon={command.icon}
      shortcut={shortcut}
      tooltip={command.label.title}
      // @ts-expect-error - The type should be discriminated
      onClick={() => command.run(...args)}
      {...props}
    />
  )
}

/**
 * @deprecated
 */
export const CommandIdButton = <T extends FollowCommandId>({
  commandId,
  ...props
}: CommandIdButtonProps<T>) => {
  const cmd = useCommand(commandId)
  if (!cmd) return
  return <CommandActionButton command={cmd} {...props} />
}
