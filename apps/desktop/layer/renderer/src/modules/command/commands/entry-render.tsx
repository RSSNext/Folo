import { EventBus } from "@follow/utils/event-bus"

import { useRegisterCommandEffect } from "../hooks/use-register-command"
import type { Command } from "../types"
import { COMMAND_ID } from "./id"

declare module "@follow/utils/event-bus" {
  interface EventBusMap {
    "entry-render:scroll-down": never
    "entry-render:scroll-up": never
    "entry-render:next-entry": never
    "entry-render:previous-entry": never
  }
}
const LABEL_PREFIX = "Entry Render"

const category = "follow:entry-render"
export const useRegisterEntryRenderCommand = () => {
  useRegisterCommandEffect([
    {
      id: COMMAND_ID.entryRender.scrollDown,
      run: () => {
        EventBus.dispatch(COMMAND_ID.entryRender.scrollDown)
      },
      category,
      label: `${LABEL_PREFIX}: Scroll down`,
    },
    {
      id: COMMAND_ID.entryRender.scrollUp,
      run: () => {
        EventBus.dispatch(COMMAND_ID.entryRender.scrollUp)
      },
      category,
      label: `${LABEL_PREFIX}: Scroll up`,
    },
    {
      id: COMMAND_ID.entryRender.nextEntry,
      run: () => {
        EventBus.dispatch(COMMAND_ID.timeline.switchToNext)
        EventBus.dispatch(COMMAND_ID.entryRender.nextEntry)
      },
      category,
      label: `${LABEL_PREFIX}: Next entry`,
    },
    {
      id: COMMAND_ID.entryRender.previousEntry,
      run: () => {
        EventBus.dispatch(COMMAND_ID.timeline.switchToPrevious)
        EventBus.dispatch(COMMAND_ID.entryRender.previousEntry)
      },
      category,
      label: `${LABEL_PREFIX}: Previous entry`,
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

type EntryNextEntryCommand = Command<{
  id: typeof COMMAND_ID.entryRender.nextEntry
  fn: () => void
}>

type EntryPreviousEntryCommand = Command<{
  id: typeof COMMAND_ID.entryRender.previousEntry
  fn: () => void
}>

export type EntryRenderCommand =
  | EntryScrollDownCommand
  | EntryScrollUpCommand
  | EntryNextEntryCommand
  | EntryPreviousEntryCommand
