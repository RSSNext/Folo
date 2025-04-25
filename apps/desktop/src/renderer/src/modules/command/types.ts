import type { ReactNode } from "react"

import type { BasicCommand } from "./commands/types"

export type CommandCategory =
  | "follow:settings"
  | "follow:layout"
  | "follow:updates"
  | "follow:help"
  | "follow:general"

export interface KeybindingOptions {
  binding: string
  capture?: boolean
  // some keybindings are already registered in other places
  // we can skip the registration of these keybindings __FOR NOW__
  // skipRegister?: boolean
}

export interface CommandKeybindingOptions<
  ID extends string,
  T extends (...args: any[]) => unknown = (...args: unknown[]) => unknown,
> {
  /**
   * the command id.
   */
  commandId: ID
  /**
   * a set of predefined precondition strategies.
   *
   * note: this only used for keybinding and command menu.
   * command will always available when called directly.
   */
  when?: boolean
  /**
   * we use https://github.com/jamiebuilds/tinykeys so that we can use the same keybinding definition
   * for both mac and windows.
   *
   * Use `$mod` for `Cmd` on Mac and `Ctrl` on Windows and Linux.
   */
  keyBinding?: KeybindingOptions | string
  /**
   * additional arguments for the command.
   *
   * Only used when the command is called from a keybinding.
   */
  args?: Parameters<T>
}

export interface Command<
  T extends { id: string; fn: (...args: any[]) => unknown } = {
    id: string
    fn: (...args: unknown[]) => unknown
  },
> {
  readonly id: T["id"]
  readonly label: {
    title: string
    description?: string
  }
  readonly icon?: ReactNode | ((props?: { isActive?: boolean }) => ReactNode)
  readonly category: CommandCategory
  readonly run: T["fn"]

  // readonly when: boolean
  // readonly keyBinding?: KeybindingOptions
}

export type SimpleCommand<T extends string> = Command<{ id: T; fn: () => void }>

export interface CommandOptions<
  T extends { id: string; fn: (...args: any[]) => unknown } = {
    id: string
    fn: (...args: any[]) => unknown
  },
> {
  id: T["id"]
  // main text on the left..
  // make text a function so that we can do i18n and interpolation when we need to
  label:
    | string
    | (() => string)
    | { title: string; description?: string }
    | (() => { title: string; description?: string })
  icon?: ReactNode | ((props?: { isActive?: boolean }) => ReactNode)
  category?: CommandCategory
  run: T["fn"]

  when?: boolean
  keyBinding?: T["fn"] extends () => void ? KeybindingOptions | string : never
}

export type FollowCommandMap = {
  [K in FollowCommand["id"]]: Extract<FollowCommand, { id: K }>
  // [K in FollowCommand["id"]]: K extends UnknownCommand["id"]
  //   ? UnknownCommand
  //   : Extract<FollowCommand, { id: K }>
}

// type AnyCommand = Command<string & {}, (...args: any[]) => void>
export type UnknownCommand = Command<{
  id: string & { __brand: true }
  fn: (...args: unknown[]) => void
}>

export type FollowCommandId = FollowCommand["id"]
export type FollowCommand = BasicCommand // | UnknownCommand
