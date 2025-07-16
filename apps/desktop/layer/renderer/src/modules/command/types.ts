import type { ReactNode } from "react"

import type { BasicCommand } from "./commands/types"

type ExtractCategory<T extends string> = T extends `category.${string}` ? T : never
export type CommandCategory = ExtractCategory<Parameters<typeof tShortcuts>[0]>

export interface KeybindingOptions {
  binding: string
  capture?: boolean
  // some keybindings are already registered in other places
  // we can skip the registration of these keybindings __FOR NOW__
  // skipRegister?: boolean
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
  icon?: string | ReactNode | ((props?: { isActive?: boolean }) => ReactNode)
  category?: CommandCategory
  run: T["fn"]

  when?: boolean
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
