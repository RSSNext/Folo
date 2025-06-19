import type { ActionId, SupportedLanguages } from "@follow/models/types"
import type { ParseKeys } from "i18next"
import type { SFSymbol } from "sf-symbols-typescript"

import { actionActions } from "./store"

export const filterFieldOptions: Array<{
  label: Extract<ParseKeys<"settings">, `actions.action_card.feed_options.${string}`>
  value: string
  type?: "text" | "number" | "view" | "status"
}> = [
  {
    label: "actions.action_card.feed_options.status",
    value: "status",
    type: "status",
  },
  {
    label: "actions.action_card.feed_options.subscription_view",
    value: "view",
    type: "view",
  },
  {
    label: "actions.action_card.feed_options.feed_title",
    value: "title",
  },
  {
    label: "actions.action_card.feed_options.feed_category",
    value: "category",
  },
  {
    label: "actions.action_card.feed_options.site_url",
    value: "site_url",
  },
  {
    label: "actions.action_card.feed_options.feed_url",
    value: "feed_url",
  },
  {
    label: "actions.action_card.feed_options.entry_title",
    value: "entry_title",
  },
  {
    label: "actions.action_card.feed_options.entry_content",
    value: "entry_content",
  },
  {
    label: "actions.action_card.feed_options.entry_url",
    value: "entry_url",
  },
  {
    label: "actions.action_card.feed_options.entry_author",
    value: "entry_author",
  },
  {
    label: "actions.action_card.feed_options.entry_media_length",
    value: "entry_media_length",
    type: "number",
  },
]

export const filterOperatorOptions: Array<{
  label: Extract<ParseKeys<"settings">, `actions.action_card.operation_options.${string}`>
  value: string
  types: Array<"text" | "number" | "view" | "status">
}> = [
  {
    label: "actions.action_card.operation_options.contains",
    value: "contains",
    types: ["text"],
  },
  {
    label: "actions.action_card.operation_options.does_not_contain",
    value: "not_contains",
    types: ["text"],
  },
  {
    label: "actions.action_card.operation_options.is_equal_to",
    value: "eq",
    types: ["number", "text", "view", "status"],
  },
  {
    label: "actions.action_card.operation_options.is_not_equal_to",
    value: "not_eq",
    types: ["number", "text", "view"],
  },
  {
    label: "actions.action_card.operation_options.is_greater_than",
    value: "gt",
    types: ["number"],
  },
  {
    label: "actions.action_card.operation_options.is_less_than",
    value: "lt",
    types: ["number"],
  },
  {
    label: "actions.action_card.operation_options.matches_regex",
    value: "regex",
    types: ["text"],
  },
]

export type ActionAction = {
  value: ActionId
  label: Extract<ParseKeys<"settings">, `actions.action_card.${string}`>
  onEnable?: (index: number) => void
  icon: SFSymbol
  iconClassname: string
  settingsPath?: string

  prefixElement?: React.ReactNode
}

export const availableActionMap: Record<ActionId, ActionAction> = {
  summary: {
    value: "summary",
    label: "actions.action_card.generate_summary",
    icon: "sparkles",
    iconClassname: "i-mgc-ai-cute-re",
  },
  translation: {
    value: "translation",
    label: "actions.action_card.translate_into",
    icon: "translate",
    iconClassname: "i-mgc-translate-2-ai-cute-re",
  },
  readability: {
    value: "readability",
    label: "actions.action_card.enable_readability",
    icon: "text.document",
    iconClassname: "i-mgc-docment-cute-re",
  },
  sourceContent: {
    value: "sourceContent",
    label: "actions.action_card.source_content",
    icon: "macwindow",
    iconClassname: "i-mgc-web-cute-re",
  },
  newEntryNotification: {
    value: "newEntryNotification",
    label: "actions.action_card.new_entry_notification",
    icon: "bell.and.waves.left.and.right",
    iconClassname: "i-mgc-notification-cute-re",
    settingsPath: "notifications",
  },
  silence: {
    value: "silence",
    label: "actions.action_card.silence",
    icon: "speaker.slash",
    iconClassname: "i-mgc-volume-mute-cute-re",
  },
  block: {
    value: "block",
    label: "actions.action_card.block",
    icon: "xmark.circle",
    iconClassname: "i-mgc-delete-2-cute-re",
  },
  star: {
    value: "star",
    label: "actions.action_card.star",
    icon: "star",
    iconClassname: "i-mgc-star-cute-re",
  },
  rewriteRules: {
    value: "rewriteRules",
    label: "actions.action_card.rewrite_rules",
    icon: "pencil.and.outline",
    iconClassname: "i-mgc-quill-pen-cute-re",
    onEnable: (index: number) => {
      actionActions.addRewriteRule(index)
    },
  },
  webhooks: {
    value: "webhooks",
    label: "actions.action_card.webhooks",
    icon: "arrow.up.right.square",
    iconClassname: "i-mgc-webhook-cute-re",
    onEnable: (index) => {
      actionActions.addWebhook(index)
    },
  },
}

export const translationOptions: {
  label: string
  value: SupportedLanguages
}[] = [
  {
    label: "English",
    value: "en",
  },
  {
    label: "日本語",
    value: "ja",
  },
  {
    label: "简体中文",
    value: "zh-CN",
  },
  {
    label: "繁體中文",
    value: "zh-TW",
  },
]
