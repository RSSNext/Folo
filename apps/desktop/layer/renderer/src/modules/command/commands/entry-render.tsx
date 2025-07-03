import { EventBus } from "@follow/utils/event-bus"
import { useTranslation } from "react-i18next"

import { useRegisterCommandEffect } from "../hooks/use-register-command"
import type { Command, CommandCategory } from "../types"
import { COMMAND_ID } from "./id"

declare module "@follow/utils/event-bus" {
  interface EventBusMap {
    "entry-render:scroll-down": never
    "entry-render:scroll-up": never
    "entry-render:next-entry": never
    "entry-render:previous-entry": never
  }
}

const category: CommandCategory = "category.entry_render"
export const useRegisterEntryRenderCommand = () => {
  const { t } = useTranslation("shortcuts")
  useRegisterCommandEffect([
    {
      id: COMMAND_ID.entryRender.scrollDown,
      run: () => {
        EventBus.dispatch(COMMAND_ID.entryRender.scrollDown)
      },
      category,
      label: {
        title: t("command.entry.scroll_down.title"),
        description: t("command.entry.scroll_down.description"),
      },
    },
    {
      id: COMMAND_ID.entryRender.scrollUp,
      run: () => {
        EventBus.dispatch(COMMAND_ID.entryRender.scrollUp)
      },
      category,
      label: {
        title: t("command.entry.scroll_up.title"),
        description: t("command.entry.scroll_up.description"),
      },
    },
    {
      id: COMMAND_ID.entryRender.nextEntry,
      run: () => {
        EventBus.dispatch(COMMAND_ID.timeline.switchToNext)
        EventBus.dispatch(COMMAND_ID.entryRender.nextEntry)
      },
      category,
      label: {
        title: t("command.entry.next_entry.title"),
        description: t("command.entry.next_entry.description"),
      },
    },
    {
      id: COMMAND_ID.entryRender.previousEntry,
      run: () => {
        EventBus.dispatch(COMMAND_ID.timeline.switchToPrevious)
        EventBus.dispatch(COMMAND_ID.entryRender.previousEntry)
      },
      category,
      label: {
        title: t("command.entry.previous_entry.title"),
        description: t("command.entry.previous_entry.description"),
      },
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
