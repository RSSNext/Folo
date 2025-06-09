import { withResponsiveComponent } from "@follow/components/utils/selector.js"
import { Outlet } from "react-router"

const noop = () =>
  Promise.resolve({
    default: () => null,
  })
export const CenterColumnLayout = withResponsiveComponent<object>(
  () =>
    import("~/modules/app-layout/timeline-column/desktop").then((m) => ({
      default: m.CenterColumnDesktop,
    })),
  () =>
    Promise.resolve({
      default: Outlet,
    }),
)

export const MobileCenterColumnScreen = withResponsiveComponent<object>(noop, () =>
  import("~/modules/app-layout/timeline-column/mobile").then((m) => ({
    default: m.EntryColumnMobile,
  })),
)
