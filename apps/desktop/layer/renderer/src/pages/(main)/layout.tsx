import { withResponsiveComponent } from "@follow/components/utils/selector.js"

import { MainDestopLayout } from "~/modules/app-layout/subscription-column/index"

export const Component = withResponsiveComponent(
  () => Promise.resolve({ default: MainDestopLayout }),
  async () => {
    const { default: DownloadPage } = await import("~/modules/download")
    return { default: DownloadPage }
  },
)
