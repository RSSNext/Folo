import { withResponsiveSyncComponent } from "@follow/components/utils/selector.js"

import { InboxTable as InboxTableDesktop } from "./inbox-table.electron"
import { InboxTable as InboxTableMobile } from "./inbox-table.mobile"

export const InboxTable = withResponsiveSyncComponent<ComponentType>(
  InboxTableDesktop,
  InboxTableMobile,
)
