import { UrlBuilder as UrlBuilderClass } from "@follow/utils/url-builder"

import { proxyEnv } from "./proxy-env"

export const UrlBuilder = new UrlBuilderClass(proxyEnv.WEB_URL)
