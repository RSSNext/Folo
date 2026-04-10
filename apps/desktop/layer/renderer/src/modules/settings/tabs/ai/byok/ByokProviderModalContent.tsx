import { Button } from "@follow/components/ui/button/index.js"
import { Input } from "@follow/components/ui/input/index.js"
import { Label } from "@follow/components/ui/label/index.jsx"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@follow/components/ui/select/index.js"
import type { ByokProviderName, UserByokProviderConfig } from "@follow/shared/settings/interface"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { testConnection } from "./connection-test"
import { getProviderOption, isLocalProvider, PROVIDER_OPTIONS } from "./constants"
import { ModelSelector } from "./ModelSelector"

interface ByokProviderModalContentProps {
  provider: UserByokProviderConfig | null
  configuredProviders?: ByokProviderName[]
  onSave: (provider: UserByokProviderConfig) => void
  onCancel: () => void
}

const EMPTY_CONFIGURED_PROVIDERS: ByokProviderName[] = []

export const ByokProviderModalContent = ({
  provider,
  configuredProviders = EMPTY_CONFIGURED_PROVIDERS,
  onSave,
  onCancel,
}: ByokProviderModalContentProps) => {
  const { t } = useTranslation("ai")

  // Filter out already configured providers, but keep the current one if editing
  const availableProviders = PROVIDER_OPTIONS.filter(
    (option) => !configuredProviders.includes(option.value) || option.value === provider?.provider,
  )

  const availableCloud = availableProviders.filter((p) => p.category === "cloud")
  const availableLocal = availableProviders.filter((p) => p.category === "local")

  // Get the first available provider or fallback to the current one
  const defaultProvider = availableProviders[0]?.value ?? provider?.provider ?? "openai"

  const [formData, setFormData] = useState<UserByokProviderConfig>({
    provider: provider?.provider ?? defaultProvider,
    baseURL: provider?.baseURL ?? null,
    apiKey: provider?.apiKey ?? null,
    headers: provider?.headers ?? {},
    model: provider?.model ?? null,
    name: provider?.name ?? null,
  })

  const [isTesting, setIsTesting] = useState(false)

  const currentProviderOption = getProviderOption(formData.provider)
  const isLocal = isLocalProvider(formData.provider)

  const handleProviderChange = useCallback(
    (value: string) => {
      const newProvider = value as ByokProviderName
      const option = getProviderOption(newProvider)
      setFormData({
        ...formData,
        provider: newProvider,
        // Auto-fill base URL from default when switching providers
        baseURL: option?.defaultBaseURL ?? formData.baseURL ?? null,
        // Clear model when switching providers
        model: null,
      })
    },
    [formData],
  )

  const handleTestConnection = useCallback(async () => {
    setIsTesting(true)
    try {
      const result = await testConnection(formData)
      if (result.success) {
        if (result.modelVerified === false) {
          toast.warning(result.error)
        } else {
          toast.success(t("byok.providers.form.connection_success"))
        }
      } else {
        toast.error(t("byok.providers.form.connection_failed", { error: result.error }))
      }
    } catch {
      toast.error(t("byok.providers.form.connection_failed", { error: "Unexpected error" }))
    } finally {
      setIsTesting(false)
    }
  }, [formData, t])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.provider) {
      return
    }
    onSave(formData)
  }

  const effectiveBaseURL = formData.baseURL || currentProviderOption?.defaultBaseURL || ""

  return (
    <form onSubmit={handleSubmit} className="min-w-[40ch] space-y-4">
      {/* Provider Selection */}
      <div className="space-y-2">
        <Label htmlFor="provider">{t("byok.providers.form.provider")}</Label>
        <Select
          value={formData.provider}
          disabled={availableProviders.length === 0}
          onValueChange={handleProviderChange}
        >
          <SelectTrigger id="provider">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableCloud.length > 0 && (
              <SelectGroup>
                <SelectLabel>{t("byok.providers.category.cloud")}</SelectLabel>
                {availableCloud.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
            {availableLocal.length > 0 && (
              <SelectGroup>
                <SelectLabel>{t("byok.providers.category.local")}</SelectLabel>
                {availableLocal.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Display Name (optional) */}
      <div className="space-y-2">
        <Label htmlFor="displayName">{t("byok.providers.form.display_name")}</Label>
        <Input
          id="displayName"
          type="text"
          placeholder={t("byok.providers.form.display_name_placeholder")}
          value={formData.name ?? ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              name: e.target.value || null,
            })
          }
        />
      </div>

      {/* Base URL */}
      <div className="space-y-2">
        <Label htmlFor="baseURL">{t("byok.providers.form.base_url")}</Label>
        <Input
          id="baseURL"
          type="url"
          placeholder={
            currentProviderOption?.defaultBaseURL ?? t("byok.providers.form.base_url_placeholder")
          }
          value={formData.baseURL ?? ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              baseURL: e.target.value || null,
            })
          }
        />
        <p className="text-xs text-text-secondary">{t("byok.providers.form.base_url_help")}</p>
      </div>

      {/* API Key */}
      <div className="space-y-2">
        <Label htmlFor="apiKey">
          {t("byok.providers.form.api_key")}
          {!currentProviderOption?.apiKeyRequired && (
            <span className="ml-1 text-xs font-normal text-text-secondary">
              ({t("byok.providers.form.api_key_optional")})
            </span>
          )}
        </Label>
        <Input
          id="apiKey"
          type="password"
          placeholder={t("byok.providers.form.api_key_placeholder")}
          value={formData.apiKey ?? ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              apiKey: e.target.value || null,
            })
          }
        />
        <p className="text-xs text-text-secondary">{t("byok.providers.form.api_key_help")}</p>
      </div>

      {/* Model Selection */}
      <div className="space-y-2">
        <Label>{t("byok.providers.form.model")}</Label>
        <ModelSelector
          provider={formData.provider}
          baseURL={effectiveBaseURL}
          apiKey={formData.apiKey}
          value={formData.model ?? ""}
          onChange={(model) => setFormData({ ...formData, model: model || null })}
          supportsDiscovery={currentProviderOption?.supportsModelDiscovery ?? false}
        />
        <p className="text-xs text-text-secondary">{t("byok.providers.form.model_help")}</p>
      </div>

      {/* CORS Warning for Local Providers */}
      {isLocal && (
        <div className="rounded-md border border-yellow/30 bg-yellow/5 p-3">
          <div className="flex items-start gap-2">
            <i className="i-mgc-warning-cute-re mt-0.5 size-4 shrink-0 text-yellow" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-text">
                {t("byok.providers.cors_warning.title")}
              </p>
              <p className="text-xs text-text-secondary">
                {t("byok.providers.cors_warning.description")}
              </p>
              {formData.provider === "ollama" && (
                <p className="font-mono text-[10px] text-text-secondary">
                  {t("byok.providers.cors_warning.ollama_hint")}
                </p>
              )}
              {formData.provider === "lmstudio" && (
                <p className="text-[10px] text-text-secondary">
                  {t("byok.providers.cors_warning.lmstudio_hint")}
                </p>
              )}
              <p className="text-[10px] text-text-secondary">
                {t("byok.providers.cors_warning.https_note")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Test Connection + Action Buttons */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isTesting}
          onClick={handleTestConnection}
        >
          {isTesting ? (
            <>
              <i className="i-mgc-loading-3-cute-re mr-1 size-3.5 animate-spin" />
              {t("byok.providers.form.testing_connection")}
            </>
          ) : (
            <>
              <i className="i-mgc-signal-cute-re mr-1 size-3.5" />
              {t("byok.providers.form.test_connection")}
            </>
          )}
        </Button>

        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("words.cancel", { ns: "common" })}
          </Button>
          <Button type="submit">{t("words.save", { ns: "common" })}</Button>
        </div>
      </div>
    </form>
  )
}
