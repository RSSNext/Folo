import { Button } from "@follow/components/ui/button/index.js"
import { Tooltip, TooltipContent, TooltipTrigger } from "@follow/components/ui/tooltip/index.jsx"
import type { UserByokProviderConfig } from "@follow/shared/settings/interface"
import { useTranslation } from "react-i18next"

interface ByokProviderItemProps {
  provider: UserByokProviderConfig
  onDelete: () => void
  onEdit: () => void
}

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  google: "Google",
  "vercel-ai-gateway": "Vercel AI Gateway",
}

export const ByokProviderItem = ({ provider, onEdit, onDelete }: ByokProviderItemProps) => {
  const { t } = useTranslation("ai")

  const providerLabel = PROVIDER_LABELS[provider.provider] || provider.provider

  return (
    <div className="group -ml-3 rounded-lg border border-border p-3 transition-colors hover:bg-material-medium">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-text">{providerLabel}</h4>
            <div className="rounded-full bg-blue/10 px-2 py-1 text-xs text-blue">
              {provider.provider}
            </div>
          </div>
          <div className="space-y-1">
            {provider.baseURL && (
              <p className="text-xs text-text-secondary">
                <span className="text-text-tertiary">Base URL:</span> {provider.baseURL}
              </p>
            )}
            <p className="text-xs text-text-secondary">
              <span className="text-text-tertiary">API Key:</span>{" "}
              {provider.apiKey ? "••••••••" : t("byok.providers.no_api_key")}
            </p>
            {provider.headers && Object.keys(provider.headers).length > 0 && (
              <p className="text-xs text-text-secondary">
                <span className="text-text-tertiary">Custom Headers:</span>{" "}
                {Object.keys(provider.headers).length} {t("byok.providers.headers_count")}
              </p>
            )}
          </div>
        </div>

        <div className="ml-4 flex items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <i className="i-mgc-edit-cute-re size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("byok.providers.edit")}</TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onDelete}>
                <i className="i-mgc-delete-2-cute-re size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("byok.providers.delete")}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
