import { Button } from "@follow/components/ui/button/index.js"
import { Tooltip, TooltipContent, TooltipTrigger } from "@follow/components/ui/tooltip/index.jsx"
import type { UserByokProviderConfig } from "@follow/shared/settings/interface"
import { useTranslation } from "react-i18next"

interface ByokProviderItemProps {
  provider: UserByokProviderConfig
  onDelete: () => void
  /** Without it the provider can only be deleted */
  onEdit?: () => void
}

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  google: "Google",
  "vercel-ai-gateway": "Vercel AI Gateway",
  openrouter: "OpenRouter",
}

export const ByokProviderItem = ({ provider, onEdit, onDelete }: ByokProviderItemProps) => {
  const { t } = useTranslation("ai")

  const providerLabel = PROVIDER_LABELS[provider.provider] || provider.provider

  return (
    <div className="group -ml-3 rounded-lg border border-border p-3 transition-colors hover:bg-material-medium">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-text">{providerLabel}</h4>
            {/* A provider without a key is skipped by the server, so it is not configured */}
            {provider.apiKey ? (
              <span className="inline-flex rounded-full bg-accent/10 px-2 py-1 text-xs text-accent">
                {t("byok.providers.configured")}
              </span>
            ) : (
              <span className="inline-flex rounded-full bg-orange/10 px-2 py-1 text-xs text-orange">
                {t("byok.providers.missing_api_key")}
              </span>
            )}
          </div>
        </div>

        <div className="ml-4 flex items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
          {onEdit && (
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={t("byok.providers.edit")}
                  onClick={onEdit}
                >
                  <i className="i-mgc-edit-cute-re size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("byok.providers.edit")}</TooltipContent>
            </Tooltip>
          )}
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label={t("byok.providers.delete")}
                onClick={onDelete}
              >
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
