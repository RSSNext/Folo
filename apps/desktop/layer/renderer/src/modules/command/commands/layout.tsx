import { EventBus } from "@follow/utils/event-bus"
import { useTranslation } from "react-i18next"

import { setTimelineColumnShow } from "~/atoms/sidebar"

import { useRegisterCommandEffect } from "../hooks/use-register-command"
import type { Command, CommandCategory } from "../types"
import { COMMAND_ID } from "./id"

interface FocusEvent {
  highlightBoundary: boolean
}
declare module "@follow/utils/event-bus" {
  interface EventBusMap {
    "layout:focus-to-timeline": FocusEvent
    "layout:focus-to-subscription": FocusEvent
    "layout:focus-to-entry-render": FocusEvent
  }
}

const category: CommandCategory = "category.layout"
export const useRegisterLayoutCommands = () => {
  const { t } = useTranslation("shortcuts")
  useRegisterCommandEffect([
    {
      id: COMMAND_ID.layout.toggleSubscriptionColumn,
      label: {
        title: t("command.layout.toggle_subscription_column.title"),
        description: t("command.layout.toggle_subscription_column.description"),
      },
      category,
      run: () => {
        setTimelineColumnShow((show) => !show)
      },
    },
    {
      id: COMMAND_ID.layout.focusToTimeline,
      label: t("command.layout.focus_to_timeline.title"),
      category,
      run: () => {
        EventBus.dispatch(COMMAND_ID.layout.focusToTimeline, { highlightBoundary: true })
      },
    },
    {
      id: COMMAND_ID.layout.focusToSubscription,
      label: t("command.layout.focus_to_subscription.title"),
      category,
      run: () => {
        EventBus.dispatch(COMMAND_ID.layout.focusToSubscription, { highlightBoundary: true })
      },
    },
    {
      id: COMMAND_ID.layout.focusToEntryRender,
      label: t("command.layout.focus_to_entry_render.title"),
      category,
      run: () => {
        EventBus.dispatch(COMMAND_ID.layout.focusToEntryRender, { highlightBoundary: true })
      },
    },
  ])
}

export type FocusToSubscriptionCommand = Command<{
  id: typeof COMMAND_ID.layout.focusToSubscription
  fn: () => void
}>

export type ToggleTimelineColumnCommand = Command<{
  id: typeof COMMAND_ID.layout.toggleSubscriptionColumn
  fn: () => void
}>

export type FocusToTimelineCommand = Command<{
  id: typeof COMMAND_ID.layout.focusToTimeline
  fn: () => void
}>
export type FocusToEntryRenderCommand = Command<{
  id: typeof COMMAND_ID.layout.focusToEntryRender
  fn: () => void
}>

export type LayoutCommand =
  | ToggleTimelineColumnCommand
  | FocusToTimelineCommand
  | FocusToSubscriptionCommand
  | FocusToEntryRenderCommand
