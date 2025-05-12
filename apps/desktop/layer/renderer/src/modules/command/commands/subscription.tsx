import { EventBus } from "@follow/utils/event-bus"

import { useRegisterCommandEffect } from "../hooks/use-register-command"
import type { Command } from "../types"
import { COMMAND_ID } from "./id"

declare module "@follow/utils/event-bus" {
  interface EventBusMap {
    "subscription:switch-tab-to-next": never
    "subscription:switch-tab-to-previous": never
    "subscription:switch-tab-to-article": never
    "subscription:switch-tab-to-social": never
    "subscription:switch-tab-to-picture": never
    "subscription:switch-tab-to-video": never
    "subscription:switch-tab-to-audio": never
    "subscription:switch-tab-to-notification": never
  }
}
const LABEL_PREFIX = "Subscription"
export const useRegisterSubscriptionCommands = () => {
  useRegisterCommandEffect([
    {
      id: COMMAND_ID.subscription.switchTabToNext,
      label: `${LABEL_PREFIX}: Switch to next tab`,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.switchTabToNext)
      },
    },
    {
      id: COMMAND_ID.subscription.switchTabToPrevious,
      label: `${LABEL_PREFIX}: Switch to previous tab`,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.switchTabToPrevious)
      },
    },
    {
      id: COMMAND_ID.subscription.switchTabToArticle,
      label: `${LABEL_PREFIX}: Switch to article tab`,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.switchTabToArticle)
      },
    },
    {
      id: COMMAND_ID.subscription.switchTabToSocial,
      label: `${LABEL_PREFIX}: Switch to social tab`,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.switchTabToSocial)
      },
    },
    {
      id: COMMAND_ID.subscription.switchTabToPicture,
      label: `${LABEL_PREFIX}: Switch to picture tab`,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.switchTabToPicture)
      },
    },
    {
      id: COMMAND_ID.subscription.switchTabToVideo,
      label: `${LABEL_PREFIX}: Switch to video tab`,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.switchTabToVideo)
      },
    },
    {
      id: COMMAND_ID.subscription.switchTabToAudio,
      label: `${LABEL_PREFIX}: Switch to audio tab`,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.switchTabToAudio)
      },
    },
    {
      id: COMMAND_ID.subscription.switchTabToNotification,
      label: `${LABEL_PREFIX}: Switch to notification tab`,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.switchTabToNotification)
      },
    },
  ])
}

type SwitchTabToNextCommand = Command<{
  id: typeof COMMAND_ID.subscription.switchTabToNext
  fn: () => void
}>

type SwitchTabToPreviousCommand = Command<{
  id: typeof COMMAND_ID.subscription.switchTabToPrevious
  fn: () => void
}>

type SwitchTabToArticleCommand = Command<{
  id: typeof COMMAND_ID.subscription.switchTabToArticle
  fn: () => void
}>

type SwitchTabToSocialCommand = Command<{
  id: typeof COMMAND_ID.subscription.switchTabToSocial
  fn: () => void
}>

type SwitchTabToPictureCommand = Command<{
  id: typeof COMMAND_ID.subscription.switchTabToPicture
  fn: () => void
}>

type SwitchTabToVideoCommand = Command<{
  id: typeof COMMAND_ID.subscription.switchTabToVideo
  fn: () => void
}>

type SwitchTabToAudioCommand = Command<{
  id: typeof COMMAND_ID.subscription.switchTabToAudio
  fn: () => void
}>

type SwitchTabToNotificationCommand = Command<{
  id: typeof COMMAND_ID.subscription.switchTabToNotification
  fn: () => void
}>

export type SubscriptionCommand =
  | SwitchTabToNextCommand
  | SwitchTabToPreviousCommand
  | SwitchTabToArticleCommand
  | SwitchTabToSocialCommand
  | SwitchTabToPictureCommand
  | SwitchTabToVideoCommand
  | SwitchTabToAudioCommand
  | SwitchTabToNotificationCommand
