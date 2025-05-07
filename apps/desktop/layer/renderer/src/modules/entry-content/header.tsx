import { withResponsiveSyncComponent } from "@follow/components/utils/selector.js"

import { EntryHeader as EntryHeaderDesktop } from "./header.electron"
import { EntryHeader as EntryHeaderMobile } from "./header.mobile"
import type { EntryHeaderProps } from "./header.shared"

export const EntryHeader = withResponsiveSyncComponent<EntryHeaderProps>(
  EntryHeaderDesktop,
  EntryHeaderMobile,
)
