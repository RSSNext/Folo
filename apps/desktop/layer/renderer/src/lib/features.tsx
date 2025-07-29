import type { ExtractResponseData, GetStatusConfigsResponse } from "@follow-app/client-sdk"
import type { FC } from "react"

import { useFeature } from "~/hooks/biz/useFeature"

export const featureConfigMap: Record<string, keyof ExtractResponseData<GetStatusConfigsResponse>> =
  {
    ai: "AI_CHAT_ENABLED",
  }

export const withFeature =
  (feature: keyof typeof featureConfigMap) =>
  <T extends object>(Component: FC<T>, FallbackComponent: FC<T>) => {
    const WithFeature = ({ ...props }: T) => {
      const isEnabled = useFeature(feature)

      return isEnabled ? <Component {...props} /> : <FallbackComponent {...props} />
    }

    return WithFeature
  }
