import { EventBus } from "@follow/utils/event-bus"

import { getIsZenMode, getUISettings, setUISetting, setZenMode } from "~/atoms/settings/ui"
import { setTimelineColumnShow } from "~/atoms/sidebar"

import { useRegisterCommandEffect } from "../hooks/use-register-command"
import type { Command } from "../types"
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
        EventBus.dispatch(COMMAND_ID.layout.focusToTimeline, { highlightBoundary: true })
      },
    },
    {
      id: COMMAND_ID.layout.focusToSubscription,
      label: "Focus to subscription",
      run: () => {
        EventBus.dispatch(COMMAND_ID.layout.focusToSubscription, { highlightBoundary: true })
      },
    },
    {
      id: COMMAND_ID.layout.focusToEntryRender,
      label: "Enter Selected Entry",
      run: () => {
        EventBus.dispatch(COMMAND_ID.layout.focusToEntryRender, { highlightBoundary: true })
      },
    },
    {
      id: COMMAND_ID.layout.toggleWideMode,
      label: "Toggle wide mode",
      run: () => {
        const { wideMode } = getUISettings()
        setUISetting("wideMode", !wideMode)
      },
    },
    {
      id: COMMAND_ID.layout.toggleZenMode,
      label: "Toggle zen mode",
      run: () => {
        setZenMode(!getIsZenMode())
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

export type ToggleWideModeCommand = Command<{
  id: typeof COMMAND_ID.layout.toggleWideMode
  fn: () => void
}>

export type ToggleZenModeCommand = Command<{
  id: typeof COMMAND_ID.layout.toggleZenMode
  fn: () => void
}>

export type LayoutCommand =
  | ToggleTimelineColumnCommand
  | FocusToTimelineCommand
  | FocusToSubscriptionCommand
  | FocusToEntryRenderCommand
  | ToggleWideModeCommand
  | ToggleZenModeCommand
