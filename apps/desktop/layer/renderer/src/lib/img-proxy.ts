import { WEB_BUILD } from "@follow/shared/constants"
import { role as getUserRole } from "@follow/store/user/getters"
import {
  getImageProxyUrl as getImageProxyUrlUtils,
  replaceImgUrlIfNeed as replaceImgUrlIfNeedUtils,
} from "@follow/utils/img-proxy"

export const replaceImgUrlIfNeed = (url?: string) => {
  return replaceImgUrlIfNeedUtils({
    url,
    inBrowser: WEB_BUILD,
    userRole: getUserRole(),
  })
}

export const getImageProxyUrl = (
  params: Omit<Parameters<typeof getImageProxyUrlUtils>[0], "userRole">,
) => {
  return getImageProxyUrlUtils({
    ...params,
    userRole: getUserRole(),
  })
}
