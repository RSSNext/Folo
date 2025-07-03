import { EventBus } from "@follow/utils/event-bus"
import { useTranslation } from "react-i18next"

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

const category: CommandCategory = "category.subscription"
export const useRegisterSubscriptionCommands = () => {
  const { t } = useTranslation("shortcuts")
  useRegisterCommandEffect([
    {
      id: COMMAND_ID.subscription.switchTabToNext,
      label: {
        title: t("command.subscription.switch_tab_to_next.title"),
        description: t("command.subscription.switch_tab_to_next.description"),
      },
      category,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.switchTabToNext)
      },
    },
    {
      id: COMMAND_ID.subscription.switchTabToPrevious,
      label: {
        title: t("command.subscription.switch_tab_to_previous.title"),
        description: t("command.subscription.switch_tab_to_previous.description"),
      },
      category,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.switchTabToPrevious)
      },
    },
    {
      id: COMMAND_ID.subscription.switchTabToArticle,
      label: {
        title: t("command.subscription.switch_tab_to_article.title"),
        description: t("command.subscription.switch_tab_to_article.description"),
      },
      category,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.switchTabToArticle)
      },
    },
    {
      id: COMMAND_ID.subscription.switchTabToSocial,
      label: {
        title: t("command.subscription.switch_tab_to_social.title"),
        description: t("command.subscription.switch_tab_to_social.description"),
      },
      category,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.switchTabToSocial)
      },
    },
    {
      id: COMMAND_ID.subscription.switchTabToPicture,
      label: {
        title: t("command.subscription.switch_tab_to_picture.title"),
        description: t("command.subscription.switch_tab_to_picture.description"),
      },
      category,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.switchTabToPicture)
      },
    },
    {
      id: COMMAND_ID.subscription.switchTabToVideo,
      label: {
        title: t("command.subscription.switch_tab_to_video.title"),
        description: t("command.subscription.switch_tab_to_video.description"),
      },
      category,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.switchTabToVideo)
      },
    },
    {
      id: COMMAND_ID.subscription.switchTabToAudio,
      label: {
        title: t("command.subscription.switch_tab_to_audio.title"),
        description: t("command.subscription.switch_tab_to_audio.description"),
      },
      category,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.switchTabToAudio)
      },
    },
    {
      id: COMMAND_ID.subscription.switchTabToNotification,
      label: {
        title: t("command.subscription.switch_tab_to_notification.title"),
        description: t("command.subscription.switch_tab_to_notification.description"),
      },
      category,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.switchTabToNotification)
      },
    },
    {
      id: COMMAND_ID.subscription.nextSubscription,
      label: {
        title: t("command.subscription.next_subscription.title"),
        description: t("command.subscription.next_subscription.description"),
      },
      category,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.nextSubscription)
      },
    },
    {
      id: COMMAND_ID.subscription.previousSubscription,
      label: {
        title: t("command.subscription.previous_subscription.title"),
        description: t("command.subscription.previous_subscription.description"),
      },
      category,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.previousSubscription)
      },
    },
    {
      id: COMMAND_ID.subscription.toggleFolderCollapse,
      label: {
        title: t("command.subscription.toggle_folder_collapse.title"),
        description: t("command.subscription.toggle_folder_collapse.description"),
      },
      category,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.toggleFolderCollapse)
      },
    },
    {
      id: COMMAND_ID.subscription.markAllAsRead,
      label: {
        title: t("command.subscription.mark_all_as_read.title"),
      },
      category,
      run: () => {
        const routeParams = getRouteParams()
        EventBus.dispatch(COMMAND_ID.subscription.markAllAsRead, routeParams)
      },
    },
    {
      id: COMMAND_ID.subscription.openInBrowser,
      label: {
        title: t("command.subscription.open_in_browser.title"),
      },
      category,
      run: () => {
        EventBus.dispatch(COMMAND_ID.subscription.openInBrowser)
      },
    },
    {
      id: COMMAND_ID.subscription.openSiteInBrowser,
      label: {
        title: t("command.subscription.open_site_in_browser.title"),
      },
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
