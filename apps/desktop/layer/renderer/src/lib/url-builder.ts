import { UrlBuilder as UrlBuilderClass } from "@follow/utils/url-builder"

import { WEB_URL } from "~/constants/env"

export const UrlBuilder = new UrlBuilderClass(WEB_URL)
