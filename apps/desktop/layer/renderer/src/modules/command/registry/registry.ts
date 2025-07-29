import { atom } from "jotai"

// import { createKeybindingsHandler } from "tinykeys"
import { jotaiStore } from "~/lib/jotai"

import type { Command, CommandOptions } from "../types"
import { createCommand } from "./command"

export const CommandRegistry = new (class {
  readonly atom = atom<Record<string, Command>>({})

  get commands() {
    return {
      get: (id: string) => jotaiStore.get(this.atom)[id],
      set: (id: string, value: Command) =>
        jotaiStore.set(this.atom, (prev) => ({ ...prev, [id]: value })),
      has: (id: string) => !!jotaiStore.get(this.atom)[id],
      delete: (id: string) =>
        jotaiStore.set(this.atom, (prev) => {
          const next = { ...prev }
          delete next[id]
          return next
        }),
      values: () => Object.values(jotaiStore.get(this.atom)) as Command[],
    }
  }

  register(options: CommandOptions) {
    if (this.commands.has(options.id)) {
      console.warn(`Command ${options.id} already registered.`)
      return () => {}
    }
    const command = createCommand(options)
    this.commands.set(command.id, command)

    return () => {
      this.commands.delete(command.id)
    }
  }

  has(id: string): boolean {
    return this.commands.has(id)
  }

  get(id: string): Command | undefined {
    if (!this.commands.has(id)) {
      console.warn(`Command ${id} not registered.`)
      return undefined
    }
    return this.commands.get(id)
  }

  getAll(): Command[] {
    return Array.from(this.commands.values())
  }

  run(id: string, ...args: unknown[]) {
    const command = this.get(id)
    if (!command) return

    command.run(args)
  }
})()

export function registerCommand(options: CommandOptions) {
  return CommandRegistry.register(options)
}
