import { WEB_BUILD } from "@follow/shared/constants"
import { replaceImgUrlIfNeed as replaceImgUrlIfNeedUtils } from "@follow/utils/img-proxy"

export const replaceImgUrlIfNeed = (url?: string) => {
  return replaceImgUrlIfNeedUtils({
    url,
    inBrowser: WEB_BUILD,
  })
}
