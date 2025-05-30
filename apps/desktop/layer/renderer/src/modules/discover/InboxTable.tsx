import { withResponsiveSyncComponent } from "@follow/components/utils/selector.js"

import { InboxTable as InboxTableDesktop } from "./InboxTable.electron"
import { InboxTable as InboxTableMobile } from "./InboxTable.mobile"

export const InboxTable = withResponsiveSyncComponent<ComponentType>(
  InboxTableDesktop,
  InboxTableMobile,
)
