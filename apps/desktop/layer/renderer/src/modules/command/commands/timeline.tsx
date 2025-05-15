import { EventBus } from "@follow/utils/event-bus"

import { useRegisterCommandEffect } from "../hooks/use-register-command"
import type { Command } from "../types"
import { COMMAND_ID } from "./id"

declare module "@follow/utils/event-bus" {
  interface EventBusMap {
    "timeline:switch-to-next": never
    "timeline:switch-to-previous": never
    "timeline:refetch": never
    "timeline:enter": never
  }
}
export const useRegisterTimelineCommand = () => {
  useRegisterCommandEffect([
    {
      id: COMMAND_ID.timeline.switchToNext,
      label: "Switch to next timeline",

      run: () => {
        EventBus.dispatch("timeline:switch-to-next")
      },
    },
    {
      id: COMMAND_ID.timeline.switchToPrevious,
      label: "Switch to previous timeline",
      run: () => {
        EventBus.dispatch("timeline:switch-to-previous")
      },
    },
    {
      id: COMMAND_ID.timeline.refetch,
      label: "Refetch timeline",
      run: () => {
        EventBus.dispatch("timeline:refetch")
      },
    },
    {
      id: COMMAND_ID.timeline.enter,
      label: "Enter Selected Entry",
      run: () => {
        EventBus.dispatch("timeline:enter")
      },
    },
  ])
}

export type SwitchToNextTimelineCommand = Command<{
  id: typeof COMMAND_ID.timeline.switchToNext
  fn: () => void
}>

export type SwitchToPreviousTimelineCommand = Command<{
  id: typeof COMMAND_ID.timeline.switchToPrevious
  fn: () => void
}>

export type RefetchTimelineCommand = Command<{
  id: typeof COMMAND_ID.timeline.refetch
  fn: () => void
}>

export type EnterTimelineCommand = Command<{
  id: typeof COMMAND_ID.timeline.enter
  fn: () => void
}>

export type TimelineCommand =
  | SwitchToNextTimelineCommand
  | SwitchToPreviousTimelineCommand
  | RefetchTimelineCommand
  | EnterTimelineCommand
