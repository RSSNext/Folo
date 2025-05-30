import { withResponsiveSyncComponent } from "@follow/components/utils/selector.js"

import { EntryReadHistory as EntryReadHistoryDesktop } from "./EntryReadHistory.electron"
import { EntryReadHistory as EntryReadHistoryMobile } from "./EntryReadHistory.mobile"

export const EntryReadHistory = withResponsiveSyncComponent(
  EntryReadHistoryDesktop,
  EntryReadHistoryMobile,
)
