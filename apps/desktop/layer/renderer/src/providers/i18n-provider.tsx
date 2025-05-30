import { EventBus } from "@follow/utils/event-bus"
import i18next from "i18next"
import { useAtom } from "jotai"
import type { FC, PropsWithChildren } from "react"
import { useEffect } from "react"
import { I18nextProvider } from "react-i18next"

import { getGeneralSettings } from "~/atoms/settings/general"
import { i18nAtom } from "~/i18n"

export const I18nProvider: FC<PropsWithChildren> = ({ children }) => {
  const [currentI18NInstance, update] = useAtom(i18nAtom)

  if (import.meta.env.DEV)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(
      () =>
        EventBus.subscribe("I18N_UPDATE", () => {
          const lang = getGeneralSettings().language
          const nextI18n = i18next.cloneInstance({
            lng: lang,
          })

          update(nextI18n)
        }),
      [update],
    )

  return <I18nextProvider i18n={currentI18NInstance}>{children}</I18nextProvider>
}
