import { Button } from "@follow/components/ui/button/index.js"
import { CollapseCss, CollapseCssGroup } from "@follow/components/ui/collapse/CollapseCss.js"
import { Divider } from "@follow/components/ui/divider/index.js"
import { InputV2 } from "@follow/components/ui/input/index.js"
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
import { IN_ELECTRON } from "@follow/shared/constants"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import {
  getIntegrationSettings,
  setIntegrationSetting,
  useIntegrationSettingValue,
} from "~/atoms/settings/integration"
import { downloadJsonFile, selectJsonFile } from "~/lib/export"
import { getFetchAdapter } from "~/modules/integration/fetch-adapter"

import { createSetting } from "../../helper/builder"
import { useSetSettingCanSync } from "../../modal/hooks"
import { SettingSectionTitle } from "../../section"
import { CustomIntegrationSection } from "./CustomIntegrationSection"

const { defineSettingItem, SettingBuilder } = createSetting(
  "integration",
  useIntegrationSettingValue,
  setIntegrationSetting,
)
export const SettingIntegration = () => {
  const { t } = useTranslation("settings")
  const setSync = useSetSettingCanSync()
  const [searchQuery, setSearchQuery] = useState("")
  const settings = useIntegrationSettingValue()

  useEffect(() => {
    setSync(false)
    return () => {
      setSync(true)
    }
  }, [setSync])

  const integrationCategories = useMemo(() => {
    const knowledgeManagement = {
      id: "knowledge",
      title: t("integration.categories.knowledge_management"),
      icon: <i className="i-mingcute-document-line" />,
      integrations: [
        {
          key: "cubox",
          title: t("integration.cubox.title"),
          icon: <SimpleIconsCubox />,
          enabled: settings.enableCubox,
          configured: Boolean(settings.cuboxToken),
          settings: [
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
          ],
        },
        {
          key: "obsidian",
          title: t("integration.obsidian.title"),
          icon: <SimpleIconsObsidian />,
          enabled: settings.enableObsidian,
          configured: Boolean(settings.obsidianVaultPath),
          settings: [
            defineSettingItem("enableObsidian", {
              label: t("integration.obsidian.enable.label"),
              description: t("integration.obsidian.enable.description"),
            }),
            defineSettingItem("obsidianVaultPath", {
              label: t("integration.obsidian.vaultPath.label"),
              vertical: true,
              description: t("integration.obsidian.vaultPath.description"),
            }),
          ],
        },
        {
          key: "outline",
          title: t("integration.outline.title"),
          icon: <SimpleIconsOutline />,
          enabled: settings.enableOutline,
          configured: Boolean(settings.outlineEndpoint && settings.outlineToken),
          settings: [
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
          ],
        },
        {
          key: "readwise",
          title: t("integration.readwise.title"),
          icon: <SimpleIconsReadwise />,
          enabled: settings.enableReadwise,
          configured: Boolean(settings.readwiseToken),
          settings: [
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
          ],
        },
        {
          key: "zotero",
          title: t("integration.zotero.title"),
          icon: <SimpleIconsZotero />,
          enabled: settings.enableZotero,
          configured: Boolean(settings.zoteroUserID && settings.zoteroToken),
          settings: [
            defineSettingItem("enableZotero", {
              label: t("integration.zotero.enable.label"),
              description: t("integration.zotero.enable.description"),
            }),
            defineSettingItem("zoteroUserID", {
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
          ],
        },
      ],
    }

    const readingServices = {
      id: "reading",
      title: t("integration.categories.reading_services"),
      icon: <i className="i-mingcute-book-line" />,
      integrations: [
        {
          key: "instapaper",
          title: t("integration.instapaper.title"),
          icon: <SimpleIconsInstapaper />,
          enabled: settings.enableInstapaper,
          configured: Boolean(settings.instapaperUsername && settings.instapaperPassword),
          settings: [
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
          ],
        },
        {
          key: "readeck",
          title: t("integration.readeck.title"),
          icon: <SimpleIconsReadeck />,
          enabled: settings.enableReadeck,
          configured: Boolean(settings.readeckEndpoint && settings.readeckToken),
          settings: [
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
          ],
        },
      ],
    }

    const mediaTools = {
      id: "media",
      title: t("integration.categories.media_tools"),
      icon: <i className="i-mingcute-pic-line" />,
      integrations: [
        {
          key: "eagle",
          title: t("integration.eagle.title"),
          icon: <SimpleIconsEagle />,
          enabled: settings.enableEagle,
          configured: settings.enableEagle,
          settings: [
            defineSettingItem("enableEagle", {
              label: t("integration.eagle.enable.label"),
              description: t("integration.eagle.enable.description"),
            }),
          ],
        },
      ],
    }

    const downloadTools = {
      id: "download",
      title: t("integration.categories.download_tools"),
      icon: <i className="i-mingcute-download-line" />,
      integrations: [
        {
          key: "qbittorrent",
          title: t("integration.qbittorrent.title"),
          icon: <i className="i-simple-icons-qbittorrent" />,
          enabled: settings.enableQBittorrent,
          configured: Boolean(settings.qbittorrentHost && settings.qbittorrentUsername),
          settings: [
            defineSettingItem("enableQBittorrent", {
              label: t("integration.qbittorrent.enable.label"),
              description: t("integration.qbittorrent.enable.description"),
            }),
            defineSettingItem("qbittorrentHost", {
              label: t("integration.qbittorrent.host.label"),
              vertical: true,
              description: t("integration.qbittorrent.host.description"),
            }),
            defineSettingItem("qbittorrentUsername", {
              label: t("integration.qbittorrent.username.label"),
              vertical: true,
            }),
            defineSettingItem("qbittorrentPassword", {
              label: t("integration.qbittorrent.password.label"),
              vertical: true,
              type: "password",
            }),
          ],
        },
      ],
    }

    return [knowledgeManagement, readingServices, mediaTools, downloadTools]
  }, [t, settings])

  const filteredIntegrations = useMemo(() => {
    const allIntegrations = integrationCategories.flatMap((category) =>
      category.integrations.map((integration) => ({
        ...integration,
        categoryTitle: category.title,
        categoryIcon: category.icon,
      })),
    )

    if (!searchQuery) return allIntegrations

    return allIntegrations.filter((integration) => {
      const matchesSearch = searchQuery
        ? (integration.title as string).toLowerCase().includes(searchQuery.toLowerCase()) ||
          integration.key.toString().toLowerCase().includes(searchQuery.toLowerCase())
        : true
      return matchesSearch
    })
  }, [integrationCategories, searchQuery])

  const shouldDefaultOpen = useCallback((integration: (typeof filteredIntegrations)[0]) => {
    return integration.configured
  }, [])

  return (
    <div className="mt-4 space-y-8">
      {/* Search Bar */}
      <div className="max-w-md">
        <InputV2
          icon={<i className="i-mgc-search-cute-re" />}
          canClear
          placeholder={t("integration.search.placeholder")}
          value={searchQuery}
          onChange={useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
            setSearchQuery(e.target.value)
          }, [])}
          className="h-9"
          aria-label="Search integrations"
        />
      </div>

      {/* General Section */}
      <div>
        <SettingSectionTitle title={t("integration.general")} />
        <SettingBuilder
          settings={[
            defineSettingItem("saveSummaryAsDescription", {
              label: t("integration.save_ai_summary_as_description.label"),
            }),
            // Only show browser fetch setting in Electron environment
            ...(IN_ELECTRON
              ? [
                  defineSettingItem("useBrowserFetch", {
                    label: t("integration.use_browser_fetch.label"),
                    description: t("integration.use_browser_fetch.description"),
                    onAfterChange: (value) => {
                      if (value) {
                        getFetchAdapter().preferClientFetch()
                      } else {
                        getFetchAdapter().preferElectronFetch()
                      }
                    },
                  }),
                ]
              : []),
          ]}
        />
      </div>

      <Divider />

      {/* Built-in Integration Section */}
      {filteredIntegrations.length > 0 ? (
        <>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <SettingSectionTitle title={t("integration.builtin.title")} />
              <span className="flex items-center gap-1 text-sm text-text-tertiary">
                <span className="size-2 rounded-full bg-green" />
                {filteredIntegrations.filter((i) => i.configured).length}/
                {filteredIntegrations.length} configured
              </span>
            </div>

            <CollapseCssGroup>
              <div className="space-y-4">
                {filteredIntegrations.map((integration) => (
                  <CollapseCss
                    key={integration.key}
                    collapseId={integration.key}
                    title={
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center text-text-secondary">
                          {integration.icon}
                        </span>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{integration.title as string}</span>
                          <span className="text-xs text-text-tertiary">
                            {integration.categoryTitle as string}
                          </span>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                          {integration.configured && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green/10 px-2 py-0.5 text-xs text-green">
                              <i className="i-mingcute-check-line" />
                              {t("integration.status.configured")}
                            </span>
                          )}
                          {integration.enabled && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue/10 px-2 py-0.5 text-xs text-blue">
                              <i className="i-mingcute-power-line" />
                              {t("integration.status.enabled")}
                            </span>
                          )}
                        </div>
                      </div>
                    }
                    defaultOpen={shouldDefaultOpen(integration)}
                    className="mt-4 rounded-lg border border-border bg-background px-4 py-2 shadow-sm"
                    contentClassName="px-4"
                  >
                    <div className="pb-4">
                      <SettingBuilder settings={integration.settings} />
                    </div>
                  </CollapseCss>
                ))}
              </div>
            </CollapseCssGroup>
          </div>
        </>
      ) : (
        <div className="text-center">
          <i className="i-mingcute-document-line mb-3 text-2xl text-text-tertiary" />
          <p className="mb-2 text-sm font-medium text-text-tertiary">
            No built-in integration found
          </p>
        </div>
      )}

      <Divider />

      {/* Custom Integration Section */}
      <CustomIntegrationSection searchQuery={searchQuery} />

      <BottomTip />
    </div>
  )
}

const BottomTip = () => {
  const { t } = useTranslation("settings")

  const handleExport = useCallback(() => {
    try {
      const settings = getIntegrationSettings()
      const jsonData = JSON.stringify(settings, null, 2)
      const filename = `follow-integration-settings-${new Date().toISOString().split("T")[0]}.json`
      downloadJsonFile(jsonData, filename)
      toast.success(t("integration.export.success"))
    } catch (error) {
      console.error("Failed to export integration settings:", error)
      toast.error(t("integration.export.error"))
    }
  }, [t])

  const handleImport = useCallback(async () => {
    try {
      const jsonData = await selectJsonFile()
      const settings = JSON.parse(jsonData)

      // Validate the imported settings structure
      if (typeof settings !== "object" || settings === null) {
        throw new Error("Invalid settings format")
      }

      // Get current settings to use as a base for validation
      const currentSettings = getIntegrationSettings()

      // Only apply settings that exist in the current schema
      let importCount = 0
      Object.entries(settings).forEach(([key, value]) => {
        if (key in currentSettings) {
          setIntegrationSetting(key as any, value)
          importCount++
        }
      })

      if (importCount === 0) {
        throw new Error("No valid settings found in the imported file")
      }

      toast.success(t("integration.import.success"))
    } catch (error) {
      if (error instanceof Error && error.message === "No file selected") {
        // User cancelled file selection, don't show error
        return
      }
      console.error("Failed to import integration settings:", error)
      if (error instanceof SyntaxError) {
        toast.error(t("integration.import.invalid"))
      } else {
        toast.error(t("integration.import.error"))
      }
    }
  }, [t])

  return (
    <div className="mt-6 space-y-4">
      <Divider />
      <div className="flex flex-col gap-3">
        <p className="text-text-tertiary">
          <small>{t("integration.tip")}</small>
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            buttonClassName="flex items-center gap-2"
          >
            <i className="i-mgc-download-2-cute-re mr-2 size-4" />
            {t("integration.export.button")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleImport}
            buttonClassName="flex items-center gap-2"
          >
            <i className="i-mgc-file-upload-cute-re mr-2 size-4" />
            {t("integration.import.button")}
          </Button>
        </div>
      </div>
    </div>
  )
}
