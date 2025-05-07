import type {
  Command,
  CommandOptions,
  FollowCommand,
  FollowCommandId,
  FollowCommandMap,
} from "../types"

export function createCommand<
  T extends { id: string; fn: (...args: any[]) => unknown } = {
    id: string
    fn: (...args: unknown[]) => unknown
  },
>(options: CommandOptions<T>): Command<T> {
  return {
    id: options.id,
    run: options.run,
    icon: options.icon,
    category: options.category ?? "follow:general",
    get label() {
      let { label } = options
      label = typeof label === "function" ? label?.() : label
      label = typeof label === "string" ? { title: label } : label
      return label
    },
    // when: !!(options.when ?? true),
    // keyBinding:
    //   typeof options.keyBinding === "string" ? { binding: options.keyBinding } : options.keyBinding,
  }
}

// Follow command

export function createFollowCommand<T extends FollowCommand>(
  options: CommandOptions<{ id: T["id"]; fn: T["run"] }>,
) {
  return createCommand(options)
}

export function defineFollowCommand<T extends FollowCommandId>(
  options: CommandOptions<{ id: T; fn: FollowCommandMap[T]["run"] }>,
) {
  return options as CommandOptions
}
