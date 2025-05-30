import { withResponsiveComponent } from "@follow/components/utils/selector.js"

const noop = () =>
  Promise.resolve({
    default: () => null,
  })
export const LeftSidebarLayout = withResponsiveComponent<object>(
  () =>
    import("~/modules/app-layout/feed-column/desktop").then((m) => ({
      default: m.MainDestopLayout,
    })),
  () =>
    import("~/modules/app-layout/feed-column/index.mobile").then((m) => ({
      default: m.MobileRootLayout,
    })),
)

export const MobileFeedScreen = withResponsiveComponent<object>(noop, () =>
  import("~/modules/app-layout/feed-column/mobile").then((m) => ({
    default: m.FeedColumnMobile,
  })),
)
