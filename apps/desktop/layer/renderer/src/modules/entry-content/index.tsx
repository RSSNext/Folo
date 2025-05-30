import { withResponsiveComponent } from "@follow/components/utils/selector.js"

import type { EntryContentProps } from "./index.shared"

export const EntryContent = withResponsiveComponent<ComponentType<EntryContentProps>>(
  () => import("./index.electron").then((m) => ({ default: m.EntryContent })),
  () => import("./index.mobile").then((m) => ({ default: m.EntryContent })),
)
