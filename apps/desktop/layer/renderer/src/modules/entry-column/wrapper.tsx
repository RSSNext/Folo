import { withResponsiveSyncComponent } from "@follow/components/utils/selector.js"

import { EntryColumnWrapper as EntryColumnWrapperDesktop } from "./wrapper.electron"
import { EntryColumnWrapper as EntryColumnWrapperMobile } from "./wrapper.mobile"
import type { EntryColumnWrapperProps } from "./wrapper.shared"

export const EntryColumnWrapper = withResponsiveSyncComponent<
  EntryColumnWrapperProps,
  HTMLDivElement
>(EntryColumnWrapperDesktop, EntryColumnWrapperMobile)
