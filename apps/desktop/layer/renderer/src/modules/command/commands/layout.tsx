import { EventBus } from "@follow/utils/event-bus"

import { setTimelineColumnShow } from "~/atoms/sidebar"

import { useRegisterCommandEffect } from "../hooks/use-register-command"
import type { Command } from "../types"
import { COMMAND_ID } from "./id"

declare module "@follow/utils/event-bus" {
  interface EventBusMap {
    "layout:focus-to-timeline": never
    "layout:focus-to-subscription": never
    "layout:focus-to-entry-render": never
  }
}

export const useRegisterLayoutCommands = () => {
  useRegisterCommandEffect([
    {
      id: COMMAND_ID.layout.toggleTimelineColumn,
      label: "Toggle timeline column",
      run: () => {
        setTimelineColumnShow((show) => !show)
      },
    },
    {
      id: COMMAND_ID.layout.focusToTimeline,
      label: "Focus to timeline",
      run: () => {
        EventBus.dispatch(COMMAND_ID.layout.focusToTimeline)
      },
    },
    {
      id: COMMAND_ID.layout.focusToSubscription,
      label: "Focus to subscription",
      run: () => {
        EventBus.dispatch(COMMAND_ID.layout.focusToSubscription)
      },
    },
    {
      id: COMMAND_ID.layout.focusToEntryRender,
      label: "Enter Selected Entry",
      run: () => {
        EventBus.dispatch(COMMAND_ID.layout.focusToEntryRender)
      },
    },
  ])
}

export type FocusToSubscriptionCommand = Command<{
  id: typeof COMMAND_ID.layout.focusToSubscription
  fn: () => void
}>

export type ToggleTimelineColumnCommand = Command<{
  id: typeof COMMAND_ID.layout.toggleTimelineColumn
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
