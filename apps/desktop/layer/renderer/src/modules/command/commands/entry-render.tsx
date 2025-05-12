import { EventBus } from "@follow/utils/event-bus"

import { useRegisterCommandEffect } from "../hooks/use-register-command"
import type { Command } from "../types"
import { COMMAND_ID } from "./id"

declare module "@follow/utils/event-bus" {
  interface EventBusMap {
    "entry-render:scroll-down": never
    "entry-render:scroll-up": never
  }
}
const LABEL_PREFIX = "Entry Render"
export const useRegisterEntryRenderCommand = () => {
  useRegisterCommandEffect([
    {
      id: COMMAND_ID.entryRender.scrollDown,
      run: () => {
        EventBus.dispatch(COMMAND_ID.entryRender.scrollDown)
      },
      category: "follow:entry-render",
      label: `${LABEL_PREFIX}: Scroll down`,
    },
    {
      id: COMMAND_ID.entryRender.scrollUp,
      run: () => {
        EventBus.dispatch(COMMAND_ID.entryRender.scrollUp)
      },
      category: "follow:entry-render",
      label: `${LABEL_PREFIX}: Scroll up`,
    },
  ])
}

type EntryScrollDownCommand = Command<{
  id: typeof COMMAND_ID.entryRender.scrollDown
  fn: () => void
}>

type EntryScrollUpCommand = Command<{
  id: typeof COMMAND_ID.entryRender.scrollUp
  fn: () => void
}>

export type EntryRenderCommand = EntryScrollDownCommand | EntryScrollUpCommand
