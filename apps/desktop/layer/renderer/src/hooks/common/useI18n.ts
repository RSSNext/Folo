import { useMemo } from "react"
import type { FallbackNs, UseTranslationResponse } from "react-i18next"
import { useTranslation } from "react-i18next"

import { ns } from "~/@types/constants"

const allNameSpaces = ns

export function useI18n() {
  const { t } = useTranslation()

  return useMemo(() => {
    const clonedT = t.bind(t)

    for (const ns of allNameSpaces) {
      clonedT[ns] = (key: any, options: Omit<Parameters<typeof t>[1], "ns"> = {}) => {
        return t(key, { ns: ns as any, ...options })
      }
    }
    return clonedT as typeof t & {
      [K in (typeof allNameSpaces)[number]]: UseTranslationResponse<FallbackNs<K>, undefined>["t"]
    }
  }, [t])
}
