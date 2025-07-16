import { createElement } from "react"

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
    icon:
      typeof options.icon === "string"
        ? createElement("i", { className: options.icon })
        : options.icon,
    category: options.category ?? "category.global",
    get label() {
      let { label } = options
      label = typeof label === "function" ? label?.() : label
      label = typeof label === "string" ? { title: label } : label
      return label
    },
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
