import { Button } from "@follow/components/ui/button/index.js"
import type { CustomIntegration } from "@follow/shared/settings/interface"
import { nanoid } from "nanoid"
import { memo, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { setIntegrationSetting, useIntegrationSettingValue } from "~/atoms/settings/integration"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"

import { createSetting } from "../../helper/builder"
import { SettingSectionTitle } from "../../section"
import { CustomIntegrationModalContent } from "./CustomIntegrationModal"

const { defineSettingItem, SettingBuilder } = createSetting(
  useIntegrationSettingValue,
  setIntegrationSetting,
)

interface CustomIntegrationSectionProps {
  searchQuery: string
}

export const CustomIntegrationSection = memo(({ searchQuery }: CustomIntegrationSectionProps) => {
  const settings = useIntegrationSettingValue()
  const { present } = useModalStack()

  const { t } = useTranslation("settings")

  // Check if custom integrations match search
  const customIntegrationsMatchesSearch = useMemo(() => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()

    // Check section title and related translations
    const sectionTitle = t("integration.custom_integrations.title") as string
    const enableLabel = t("integration.custom_integrations.enable.label") as string
    const enableDescription = t("integration.custom_integrations.enable.description") as string

    // Check if query matches section-related content
    if (
      sectionTitle.includes(query) ||
      enableLabel.includes(query) ||
      enableDescription.includes(query) ||
      "custom".includes(query) ||
      "action".includes(query) ||
      "actions".includes(query) ||
      "integration".includes(query) ||
      "url".includes(query) ||
      "template".includes(query) ||
      "share".includes(query) ||
      "sharing".includes(query)
    ) {
      return true
    }

    // Check existing custom integrations
    const customIntegrations = settings.customIntegration || []
    return customIntegrations.some(
      (integration) =>
        integration.name.toLowerCase().includes(query) ||
        integration.fetchTemplate?.url?.toLowerCase().includes(query) ||
        integration.fetchTemplate?.method?.toLowerCase().includes(query) ||
        Object.keys(integration.fetchTemplate?.headers || {}).some(
          (key) =>
            key.toLowerCase().includes(query) ||
            integration.fetchTemplate?.headers?.[key]?.toLowerCase().includes(query) ||
            false,
        ) ||
        (integration.fetchTemplate?.body &&
          integration.fetchTemplate.body.toLowerCase().includes(query)) ||
        (integration.type === "url-scheme" &&
          integration.urlSchemeTemplate?.scheme?.toLowerCase().includes(query)),
    )
  }, [searchQuery, t, settings.customIntegration])

  const handleCreateCustomIntegration = useCallback(() => {
    present({
      title: t("integration.custom_integrations.create.title"),
      content: () => (
        <CustomIntegrationModalContent
          onSave={(integrationData) => {
            const newIntegration: CustomIntegration = {
              ...integrationData,
              id: nanoid(),
            }

            const currentIntegrations = settings.customIntegration || []
            setIntegrationSetting("customIntegration", [...currentIntegrations, newIntegration])
          }}
        />
      ),
    })
  }, [present, settings.customIntegration, t])

  const handleEditCustomIntegration = useCallback(
    (integration: CustomIntegration) => {
      present({
        title: t("integration.custom_integrations.edit.title"),
        content: () => (
          <CustomIntegrationModalContent
            integration={integration}
            onSave={(integrationData) => {
              const currentIntegrations = settings.customIntegration || []
              const updatedIntegrations = currentIntegrations.map((i) =>
                i.id === integration.id ? { ...i, ...integrationData } : i,
              )
              setIntegrationSetting("customIntegration", updatedIntegrations)
            }}
          />
        ),
      })
    },
    [present, settings.customIntegration, t],
  )

  const handleDeleteCustomIntegration = useCallback(
    (integrationId: string) => {
      const currentIntegrations = settings.customIntegration || []
      const updatedIntegrations = currentIntegrations.filter((i) => i.id !== integrationId)
      setIntegrationSetting("customIntegration", updatedIntegrations)
      toast.success(t("integration.custom_integrations.delete.success"))
    },
    [settings.customIntegration, t],
  )

  const handleToggleCustomIntegration = useCallback(
    (integrationId: string, enabled: boolean) => {
      const currentIntegrations = settings.customIntegration || []
      const updatedIntegrations = currentIntegrations.map((i) =>
        i.id === integrationId ? { ...i, enabled } : i,
      )
      setIntegrationSetting("customIntegration", updatedIntegrations)
    },
    [settings.customIntegration],
  )

  if (settings.enableCustomIntegration && !customIntegrationsMatchesSearch) {
    return (
      <div className="text-center">
        <i className="i-mgc-webhook-cute-re text-text-tertiary mb-3 text-2xl" />
        <p className="text-text-tertiary mb-2 text-sm font-medium">No custom integration found</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        <SettingSectionTitle title={t("integration.custom_integrations.title")} />
      </div>

      <div className="space-y-6">
        <SettingBuilder
          settings={[
            defineSettingItem("enableCustomIntegration", {
              label: t("integration.custom_integrations.enable.label"),
              description: t("integration.custom_integrations.enable.description"),
            }),
          ]}
        />

        {settings.enableCustomIntegration && (
          <CustomIntegrationsSection
            integrations={settings.customIntegration || []}
            onCreateIntegration={handleCreateCustomIntegration}
            onEditIntegration={handleEditCustomIntegration}
            onDeleteIntegration={handleDeleteCustomIntegration}
            onToggleIntegration={handleToggleCustomIntegration}
          />
        )}
      </div>
    </div>
  )
})

interface CustomIntegrationsSectionProps {
  integrations: CustomIntegration[]
  onCreateIntegration: () => void
  onEditIntegration: (integration: CustomIntegration) => void
  onDeleteIntegration: (integrationId: string) => void
  onToggleIntegration: (integrationId: string, enabled: boolean) => void
}

const CustomIntegrationsSection = ({
  integrations,
  onCreateIntegration,
  onEditIntegration,
  onDeleteIntegration,
  onToggleIntegration,
}: CustomIntegrationsSectionProps) => {
  const { t } = useTranslation("settings")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium leading-none">
          {t("integration.custom_integrations.list.title")}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={onCreateIntegration}
          buttonClassName="flex items-center"
        >
          <i className="i-mgc-add-cute-re mr-2" />
          {t("integration.custom_integrations.add.button")}
        </Button>
      </div>

      {integrations.length === 0 ? (
        <div className="border-fill-secondary flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12">
          <i className="i-mgc-webhook-cute-re text-text-tertiary mb-3 text-2xl" />
          <p className="text-text-tertiary mb-2 text-sm font-medium">
            {t("integration.custom_integrations.list.empty.title")}
          </p>
          <p className="text-text-quaternary mb-4 max-w-xs text-center text-xs">
            {t("integration.custom_integrations.list.empty.description")}
          </p>
          <Button size="sm" onClick={onCreateIntegration} buttonClassName="flex items-center gap-2">
            <i className="i-mgc-add-cute-re" />
            {t("integration.custom_integrations.list.empty.button")}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="border-fill-secondary flex items-center gap-4 border-b pb-4 last:border-b-0 last:pb-0"
            >
              <span className="text-text-secondary inline-flex items-center justify-center">
                <i className={integration.icon} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-text font-medium">{integration.name}</span>
                  {integration.enabled ? (
                    <span className="bg-green/10 text-green inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs">
                      <i className="i-mingcute-power-line" />
                      <span>{t("integration.status.enabled")}</span>
                    </span>
                  ) : (
                    <span className="bg-gray/10 text-gray inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs">
                      <i className="i-mgc-pause-cute-re" />
                      <span>{t("integration.custom_integrations.status.disabled")}</span>
                    </span>
                  )}
                </div>
                <p className="text-text-tertiary truncate text-xs">
                  <span className="bg-fill text-text-secondary mr-2 rounded px-1.5 py-0.5 font-mono text-xs">
                    {integration.type === "url-scheme"
                      ? "URL"
                      : integration.fetchTemplate?.method || "GET"}
                  </span>
                  {integration.type === "url-scheme"
                    ? integration.urlSchemeTemplate?.scheme
                    : integration.fetchTemplate?.url}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onToggleIntegration(integration.id, !integration.enabled)}
                  buttonClassName="size-8 p-0"
                  aria-label={
                    integration.enabled
                      ? t("integration.custom_integrations.actions.disable")
                      : t("integration.custom_integrations.actions.enable")
                  }
                >
                  <i
                    className={integration.enabled ? "i-mgc-pause-cute-re" : "i-mgc-play-cute-re"}
                  />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEditIntegration(integration)}
                  buttonClassName="size-8 p-0"
                  aria-label={t("integration.custom_integrations.actions.edit")}
                >
                  <i className="i-mgc-edit-cute-re" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDeleteIntegration(integration.id)}
                  buttonClassName="size-8 p-0"
                  aria-label={t("integration.custom_integrations.actions.delete")}
                >
                  <i className="i-mgc-delete-2-cute-re" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
