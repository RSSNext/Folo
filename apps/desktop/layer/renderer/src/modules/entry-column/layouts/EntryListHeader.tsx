import { withResponsiveSyncComponent } from "@follow/components/utils/selector.js"

import { EntryListHeader as EntryListHeaderDesktop } from "./EntryListHeader.electron"
import { EntryListHeader as EntryListHeaderMobile } from "./EntryListHeader.mobile"
import type { EntryListHeaderProps } from "./EntryListHeader.shared"

export const EntryListHeader = withResponsiveSyncComponent<EntryListHeaderProps>(
  EntryListHeaderDesktop,
  EntryListHeaderMobile,
)
