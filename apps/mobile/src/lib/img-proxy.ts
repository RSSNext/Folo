import { role as getUserRole } from "@follow/store/user/getters"
import {
  getImageProxyUrl as getImageProxyUrlUtils,
  replaceImgUrlIfNeed as replaceImgUrlIfNeedUtils,
} from "@follow/utils/img-proxy"

export const getImageProxyUrl = (
  params: Omit<Parameters<typeof getImageProxyUrlUtils>[0], "userRole">,
) => {
  return getImageProxyUrlUtils({
    ...params,
    userRole: getUserRole(),
  })
}

export const replaceImgUrlIfNeed = (
  params: Omit<Parameters<typeof replaceImgUrlIfNeedUtils>[0], "userRole">,
) => {
  return replaceImgUrlIfNeedUtils({
    ...params,
    userRole: getUserRole(),
  })
}
