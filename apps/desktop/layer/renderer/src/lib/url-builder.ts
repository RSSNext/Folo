import { FeedViewType } from "@follow/constants"
import { UrlBuilder as UrlBuilderClass } from "@follow/utils/url-builder"

import { WEB_URL } from "~/constants/env"

class WebUrlBuilder extends UrlBuilderClass {
  constructor() {
    super(WEB_URL)
  }

  shareEntry(
    id: string,
    options?: {
      view?: FeedViewType
      subscriptionId?: string
    },
  ) {
    const { view = FeedViewType.Articles, subscriptionId = "all" } = options || {}

    return super.join(`timeline/view-${view}/${subscriptionId}/${id}`, { share: "1" })
  }
}

export const UrlBuilder = new WebUrlBuilder()
