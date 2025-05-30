import { withResponsiveSyncComponent } from "@follow/components/utils/selector.js"

import { TxTable as TxTableDesktop } from "./tx-table.electron"
import { TxTable as TxTableMobile } from "./tx-table.mobile"
import type { TxTableProps } from "./tx-table.shared"

export const TxTable = withResponsiveSyncComponent<ComponentType<TxTableProps>>(
  TxTableDesktop,
  TxTableMobile,
)
