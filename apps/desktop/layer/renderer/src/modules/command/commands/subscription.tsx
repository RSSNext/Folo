import { EventBus } from "@follow/utils/event-bus"

import type { BizRouteParams } from "~/hooks/biz/useRouteParams"
import { getRouteParams } from "~/hooks/biz/useRouteParams"

import { useRegisterCommandEffect } from "../hooks/use-register-command"
import type { Command, CommandCategory } from "../types"
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

    "subscription:next": never
    "subscription:previous": never
    "subscription:toggle-folder-collapse": never
    "subscription:mark-all-as-read": BizRouteParams
    "subscription:open-in-browser": never
    "subscription:open-site-in-browser": never
  }
}

const category: CommandCategory = "Subscription"
export const useRegisterSubscriptionCommands = () => {
  useRegisterCommandEffect([
    {
      id: COMMAND_ID.subscription.switchTabToNext,
      label: `Switch to next tab`,
      category,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.switchTabToNext)
      },
    },
    {
      id: COMMAND_ID.subscription.switchTabToPrevious,
      label: `Switch to previous tab`,
      category,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.switchTabToPrevious)
      },
    },
    {
      id: COMMAND_ID.subscription.switchTabToArticle,
      label: `Switch to article tab`,
      category,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.switchTabToArticle)
      },
    },
    {
      id: COMMAND_ID.subscription.switchTabToSocial,
      label: `Switch to social tab`,
      category,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.switchTabToSocial)
      },
    },
    {
      id: COMMAND_ID.subscription.switchTabToPicture,
      label: `Switch to picture tab`,
      category,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.switchTabToPicture)
      },
    },
    {
      id: COMMAND_ID.subscription.switchTabToVideo,
      label: `Switch to video tab`,
      category,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.switchTabToVideo)
      },
    },
    {
      id: COMMAND_ID.subscription.switchTabToAudio,
      label: `Switch to audio tab`,
      category,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.switchTabToAudio)
      },
    },
    {
      id: COMMAND_ID.subscription.switchTabToNotification,
      label: `Switch to notification tab`,
      category,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.switchTabToNotification)
      },
    },
    {
      id: COMMAND_ID.subscription.nextSubscription,
      label: `Next Subscription`,
      category,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.nextSubscription)
      },
    },
    {
      id: COMMAND_ID.subscription.previousSubscription,
      label: `Previous Subscription`,
      category,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.previousSubscription)
      },
    },
    {
      id: COMMAND_ID.subscription.toggleFolderCollapse,
      label: `Toggle Folder Collapse`,
      category,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.toggleFolderCollapse)
      },
    },
    {
      id: COMMAND_ID.subscription.markAllAsRead,
      label: `Mark All as Read`,
      category,
      run: () => {
        const routeParams = getRouteParams()
        EventBus.dispatch(COMMAND_ID.subscription.markAllAsRead, routeParams)
      },
    },
    {
      id: COMMAND_ID.subscription.openInBrowser,
      label: `Open in Browser`,
      category,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.openInBrowser)
      },
    },
    {
      id: COMMAND_ID.subscription.openSiteInBrowser,
      label: `Open site in Browser`,
      category,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.openSiteInBrowser)
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

type NextSubscriptionCommand = Command<{
  id: typeof COMMAND_ID.subscription.nextSubscription
  fn: () => void
}>

type PreviousSubscriptionCommand = Command<{
  id: typeof COMMAND_ID.subscription.previousSubscription
  fn: () => void
}>

type ToggleFolderCollapseCommand = Command<{
  id: typeof COMMAND_ID.subscription.toggleFolderCollapse
  fn: () => void
}>

type MarkAllAsReadCommand = Command<{
  id: typeof COMMAND_ID.subscription.markAllAsRead
  fn: () => void
}>

type OpenInBrowserCommand = Command<{
  id: typeof COMMAND_ID.subscription.openInBrowser
  fn: () => void
}>

type OpenSiteInBrowserCommand = Command<{
  id: typeof COMMAND_ID.subscription.openSiteInBrowser
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
  | NextSubscriptionCommand
  | PreviousSubscriptionCommand
  | ToggleFolderCollapseCommand
  | MarkAllAsReadCommand
  | OpenInBrowserCommand
  | OpenSiteInBrowserCommand
