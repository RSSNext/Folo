import { WEB_BUILD } from "@follow/shared/constants"
import { useUserRole } from "@follow/store/user/hooks"
import {
  getImageProxyUrl as getImageProxyUrlUtils,
  replaceImgUrlIfNeed as replaceImgUrlIfNeedUtils,
} from "@follow/utils/img-proxy"

import { useServerConfigs } from "~/atoms/server-configs"

export const useCanUseImageProxy = () => {
  const userRole = useUserRole()
  const serverConfig = useServerConfigs()
  const canUseProxy =
    !userRole ||
    serverConfig?.PAYMENT_PLAN_LIST.find((i) => i.role === userRole)?.limit.SECURE_IMAGE_PROXY
  return canUseProxy
}

export const useReplaceImgUrlIfNeed = () => {
  const canUseProxy = useCanUseImageProxy()

  return (url?: string) => {
    return replaceImgUrlIfNeedUtils({
      url,
      inBrowser: WEB_BUILD,
      canUseProxy,
    })
  }
}

export const useGetImageProxyUrl = () => {
  const canUseProxy = useCanUseImageProxy()

  return (params: Omit<Parameters<typeof getImageProxyUrlUtils>[0], "canUseProxy">) => {
    return getImageProxyUrlUtils({
      canUseProxy,
      ...params,
    })
  }
}
