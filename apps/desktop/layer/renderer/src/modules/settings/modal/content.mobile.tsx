import { useTypeScriptHappyCallback } from "@follow/hooks"
import PKG from "@pkg"
import { createElement, Suspense } from "react"
import { Trans, useTranslation } from "react-i18next"

import { useModalStack } from "~/components/ui/modal/stacked/hooks"

import { getSettingPages } from "../settings-glob"
import { SettingsTitle } from "../title"
import { SettingTabProvider } from "./context"
import { SidebarItems } from "./layout"

export const MobileSettingModalContent = () => {
  const { t } = useTranslation()
  const { present } = useModalStack()
  return (
    <SettingTabProvider>
      <div className="pb-safe relative">
        <div className="flex flex-col">
          <div className="mb-4 flex items-center gap-2 px-3.5 text-xl font-semibold">
            {t("user_button.preferences")}
          </div>

          <SidebarItems
            onChange={useTypeScriptHappyCallback(
              (tab) => {
                present({
                  title: "",
                  content: () => <Content tab={tab} />,
                })
              },
              [present],
            )}
          />
        </div>
      </div>
    </SettingTabProvider>
  )
}

const Content = (props: { tab: string }) => {
  const { tab } = props
  const { Component, loader } = getSettingPages()[tab]

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SettingsTitle loader={loader} className="relative -mt-6 mb-0 text-xl font-semibold" />
      {createElement(Component)}

      <p className="pb-safe mt-4 flex items-center justify-center gap-1 text-xs opacity-80">
        <Trans
          ns="settings"
          i18nKey="common.give_star"
          components={{
            Link: (
              <a
                href={`${PKG.repository.url}`}
                className="text-accent font-semibold"
                target="_blank"
              />
            ),
            HeartIcon: <i className="i-mgc-heart-cute-fi" />,
          }}
        />
      </p>
    </Suspense>
  )
}
