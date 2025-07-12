import { Divider } from "@follow/components/ui/divider/index.js"
import {
  SimpleIconsCubox,
  SimpleIconsEagle,
  SimpleIconsInstapaper,
  SimpleIconsObsidian,
  SimpleIconsOutline,
  SimpleIconsReadeck,
  SimpleIconsReadwise,
  SimpleIconsZotero,
} from "@follow/components/ui/platform-icon/icons.js"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"

import { setIntegrationSetting, useIntegrationSettingValue } from "~/atoms/settings/integration"

import { createSetting } from "../helper/builder"
import { useSetSettingCanSync } from "../modal/hooks"

const { defineSettingItem, SettingBuilder } = createSetting(
  useIntegrationSettingValue,
  setIntegrationSetting,
)
export const SettingIntegration = () => {
  const { t } = useTranslation("settings")
  const setSync = useSetSettingCanSync()
  useEffect(() => {
    setSync(false)
    return () => {
      setSync(true)
    }
  }, [setSync])
  return (
    <div className="mt-4">
      <SettingBuilder
        settings={[
          {
            type: "title",
            value: t("integration.general"),
          },
          defineSettingItem("saveSummaryAsDescription", {
            label: t("integration.save_ai_summary_as_description.label"),
          }),

          {
            type: "title",
            value: (
              <span className="flex items-center gap-2 font-bold">
                <SimpleIconsCubox />
                {t("integration.cubox.title")}
              </span>
            ),
          },
          defineSettingItem("enableCubox", {
            label: t("integration.cubox.enable.label"),
            description: t("integration.cubox.enable.description"),
          }),
          defineSettingItem("cuboxToken", {
            label: t("integration.cubox.token.label"),
            vertical: true,
            type: "password",
            description: (
              <>
                {t("integration.cubox.token.description")}{" "}
                <a
                  target="_blank"
                  className="underline"
                  rel="noreferrer noopener"
                  href="https://cubox.pro/my/settings/extensions"
                >
                  https://cubox.pro/my/settings/extensions
                </a>
              </>
            ),
          }),
          defineSettingItem("enableCuboxAutoMemo", {
            label: t("integration.cubox.autoMemo.label"),
            description: t("integration.cubox.autoMemo.description"),
          }),

          {
            type: "title",
            value: (
              <span className="flex items-center gap-2 font-bold">
                <SimpleIconsEagle />
                {t("integration.eagle.title")}
              </span>
            ),
          },
          defineSettingItem("enableEagle", {
            label: t("integration.eagle.enable.label"),
            description: t("integration.eagle.enable.description"),
          }),

          {
            type: "title",
            value: (
              <span className="flex items-center gap-2 font-bold">
                <SimpleIconsInstapaper />
                {t("integration.instapaper.title")}
              </span>
            ),
          },
          defineSettingItem("enableInstapaper", {
            label: t("integration.instapaper.enable.label"),
            description: t("integration.instapaper.enable.description"),
          }),
          defineSettingItem("instapaperUsername", {
            label: t("integration.instapaper.username.label"),
            vertical: true,
          }),
          defineSettingItem("instapaperPassword", {
            label: t("integration.instapaper.password.label"),
            vertical: true,
            type: "password",
          }),

          {
            type: "title",
            value: (
              <span className="flex items-center gap-2 font-bold">
                <SimpleIconsReadeck />
                {t("integration.readeck.title")}
              </span>
            ),
          },
          defineSettingItem("enableReadeck", {
            label: t("integration.readeck.enable.label"),
            description: t("integration.readeck.enable.description"),
          }),
          defineSettingItem("readeckEndpoint", {
            label: t("integration.readeck.endpoint.label"),
            vertical: true,
            description: t("integration.readeck.endpoint.description"),
          }),
          defineSettingItem("readeckToken", {
            label: t("integration.readeck.token.label"),
            vertical: true,
            type: "password",
            description: t("integration.readeck.token.description"),
          }),

          {
            type: "title",
            value: (
              <span className="flex items-center gap-2 font-bold">
                <SimpleIconsReadwise />
                {t("integration.readwise.title")}
              </span>
            ),
          },
          defineSettingItem("enableReadwise", {
            label: t("integration.readwise.enable.label"),
            description: t("integration.readwise.enable.description"),
          }),
          defineSettingItem("readwiseToken", {
            label: t("integration.readwise.token.label"),
            vertical: true,
            type: "password",
            description: (
              <>
                {t("integration.readwise.token.description")}{" "}
                <a
                  target="_blank"
                  className="underline"
                  rel="noreferrer noopener"
                  href="https://readwise.io/access_token"
                >
                  readwise.io/access_token
                </a>
                .
              </>
            ),
          }),

          {
            type: "title",
            value: (
              <span className="flex items-center gap-2 font-bold">
                <SimpleIconsObsidian />
                {t("integration.obsidian.title")}
              </span>
            ),
          },
          defineSettingItem("enableObsidian", {
            label: t("integration.obsidian.enable.label"),
            description: t("integration.obsidian.enable.description"),
          }),
          defineSettingItem("obsidianVaultPath", {
            label: t("integration.obsidian.vaultPath.label"),
            vertical: true,
            description: t("integration.obsidian.vaultPath.description"),
          }),

          {
            type: "title",
            value: (
              <span className="flex items-center gap-2 font-bold">
                <SimpleIconsOutline />
                {t("integration.outline.title")}
              </span>
            ),
          },
          defineSettingItem("enableOutline", {
            label: t("integration.outline.enable.label"),
            description: t("integration.outline.enable.description"),
          }),
          defineSettingItem("outlineEndpoint", {
            label: t("integration.outline.endpoint.label"),
            vertical: true,
            description: t("integration.outline.endpoint.description"),
          }),
          defineSettingItem("outlineToken", {
            label: t("integration.outline.token.label"),
            vertical: true,
            type: "password",
            description: t("integration.outline.token.description"),
          }),
          defineSettingItem("outlineCollection", {
            label: t("integration.outline.collection.label"),
            vertical: true,
            description: t("integration.outline.collection.description"),
          }),

          {
            type: "title",
            value: (
              <span className="flex items-center gap-2 font-bold">
                <SimpleIconsZotero />
                {t("integration.zotero.title")}
              </span>
            ),
          },
          defineSettingItem("enableZotero", {
            label: t("integration.zotero.enable.label"),
            description: t("integration.zotero.enable.description"),
          }),
          defineSettingItem("zoteroUserID", {
            // https://www.zotero.org/settings/keys
            label: t("integration.zotero.userID.label"),
            description: (
              <>
                {t("integration.zotero.userID.description")}{" "}
                <a
                  target="_blank"
                  className="underline"
                  rel="noreferrer noopener"
                  href="https://www.zotero.org/settings/keys"
                >
                  https://www.zotero.org/settings/keys
                </a>
              </>
            ),
            vertical: true,
            type: "password",
          }),
          defineSettingItem("zoteroToken", {
            // https://www.zotero.org/settings/keys/new
            label: t("integration.zotero.token.label"),
            description: (
              <>
                {t("integration.zotero.token.description")}{" "}
                <a
                  target="_blank"
                  className="underline"
                  rel="noreferrer noopener"
                  href="https://www.zotero.org/settings/keys/new"
                >
                  https://www.zotero.org/settings/keys/new
                </a>
              </>
            ),
            vertical: true,
            type: "password",
          }),

          BottomTip,
        ]}
      />
    </div>
  )
}

const BottomTip = () => {
  const { t } = useTranslation("settings")
  return (
    <div className="mt-6">
      <Divider />
      <p className="opacity-60">
        <small>{t("integration.tip")}</small>
      </p>
    </div>
  )
}
