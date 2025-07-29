// Entry commands

import type { EntryCommand } from "./entry"
import type { EntryRenderCommand } from "./entry-render"
import type { GlobalCommand } from "./global"
import type { IntegrationCommand } from "./integration"
import type { LayoutCommand } from "./layout"
import type { SettingsCommand } from "./settings"
import type { SubscriptionCommand } from "./subscription"
import type { TimelineCommand } from "./timeline"

export type BasicCommand =
  | EntryCommand
  | SettingsCommand
  | IntegrationCommand
  | GlobalCommand
  | LayoutCommand
  | TimelineCommand
  | EntryRenderCommand
  | SubscriptionCommand
