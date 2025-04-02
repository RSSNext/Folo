import type { ParseKeys } from "i18next"

import type { SupportedLanguages } from "@/src/lib/language"
import type { Navigation } from "@/src/lib/navigation/Navigation"
import { actionActions } from "@/src/store/action/store"
import type { ActionId, ActionRule } from "@/src/store/action/types"

import { EditRewriteRulesScreen } from "../routes/EditRewriteRules"
import { EditWebhooksScreen } from "../routes/EditWebhooks"

export const filterFieldOptions: Array<{
  label: Extract<ParseKeys<"settings">, `actions.action_card.feed_options.${string}`>
  value: string
  type?: "text" | "number" | "view"
}> = [
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
  types: Array<"text" | "number" | "view">
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
    types: ["number", "text", "view"],
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

export const availableActionList: Array<{
  value: ActionId
  label: Extract<ParseKeys<"settings">, `actions.action_card.${string}`>
  onEnable?: (index: number) => void
  onNavigate?: (router: Navigation, index: number) => void
  component?: React.FC<{ rule: ActionRule }>
}> = [
  {
    value: "summary",
    label: "actions.action_card.generate_summary",
  },
  {
    value: "translation",
    label: "actions.action_card.translate_into",
  },
  {
    value: "readability",
    label: "actions.action_card.enable_readability",
  },
  {
    value: "sourceContent",
    label: "actions.action_card.source_content",
  },
  {
    value: "newEntryNotification",
    label: "actions.action_card.new_entry_notification",
  },
  {
    value: "silence",
    label: "actions.action_card.silence",
  },
  {
    value: "block",
    label: "actions.action_card.block",
  },
  {
    value: "rewriteRules",
    label: "actions.action_card.rewrite_rules",
    onEnable: (index: number) => {
      actionActions.patchRule(index, {
        result: {
          rewriteRules: [
            {
              from: "",
              to: "",
            },
          ],
        },
      })
    },
    onNavigate: (router, index) => {
      router.pushControllerView(EditRewriteRulesScreen, { index })
    },
  },
  {
    value: "webhooks",
    label: "actions.action_card.webhooks",
    onEnable: (index) => {
      actionActions.patchRule(index, { result: { webhooks: [""] } })
    },
    onNavigate: (router, index) => {
      router.pushControllerView(EditWebhooksScreen, { index })
    },
  },
]

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
