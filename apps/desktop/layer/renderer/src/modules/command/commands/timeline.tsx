import { EventBus } from "@follow/utils/event-bus"
import { useTranslation } from "react-i18next"

import { setGeneralSetting } from "~/atoms/settings/general"

import { useRegisterCommandEffect } from "../hooks/use-register-command"
import type { Command, CommandCategory } from "../types"
import { COMMAND_ID } from "./id"

declare module "@follow/utils/event-bus" {
  interface EventBusMap {
    "timeline:switch-to-next": never
    "timeline:switch-to-previous": never
    "timeline:refetch": never
    "timeline:enter": never
  }
}

const category: CommandCategory = "category.timeline"
export const useRegisterTimelineCommand = () => {
  const { t } = useTranslation("shortcuts")
  useRegisterCommandEffect([
    {
      id: COMMAND_ID.timeline.switchToNext,
      label: t("command.timeline.switch_to_next.title"),
      category,

      run: () => {
        EventBus.dispatch("timeline:switch-to-next")
      },
    },
    {
      id: COMMAND_ID.timeline.switchToPrevious,
      label: t("command.timeline.switch_to_previous.title"),
      category,
      run: () => {
        EventBus.dispatch("timeline:switch-to-previous")
      },
    },
    {
      id: COMMAND_ID.timeline.refetch,
      label: t("command.timeline.refetch.title"),
      category,
      run: () => {
        EventBus.dispatch("timeline:refetch")
      },
    },
    {
      id: COMMAND_ID.timeline.unreadOnly,
      label: t("command.timeline.toggle_unread_only.title"),
      category,
      run: (unreadOnly: boolean) => {
        setGeneralSetting("unreadOnly", unreadOnly)
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

export type UnreadOnlyTimelineCommand = Command<{
  id: typeof COMMAND_ID.timeline.unreadOnly
  fn: (unreadOnly: boolean) => void
}>

export type TimelineCommand =
  | SwitchToNextTimelineCommand
  | SwitchToPreviousTimelineCommand
  | RefetchTimelineCommand
  | UnreadOnlyTimelineCommand
