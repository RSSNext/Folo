import { Button } from "@follow/components/ui/button/index.js"
import { Tooltip, TooltipContent, TooltipTrigger } from "@follow/components/ui/tooltip/index.jsx"
import type { UserByokProviderConfig } from "@follow/shared/settings/interface"
import { useTranslation } from "react-i18next"

import { isLocalProvider, PROVIDER_OPTIONS } from "./constants"

interface ByokProviderItemProps {
  provider: UserByokProviderConfig
  onDelete: () => void
  onEdit: () => void
}

const PROVIDER_LABELS: Record<string, string> = Object.fromEntries(
  PROVIDER_OPTIONS.map((p) => [p.value, p.label]),
)

export const ByokProviderItem = ({ provider, onEdit, onDelete }: ByokProviderItemProps) => {
  const { t } = useTranslation("ai")

  const providerLabel = provider.name || PROVIDER_LABELS[provider.provider] || provider.provider
  const isLocal = isLocalProvider(provider.provider)

  return (
    <div className="group -ml-3 rounded-lg border border-border p-3 transition-colors hover:bg-material-medium">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-text">{providerLabel}</h4>
            {provider.name && (
              <span className="text-xs text-text-secondary">
                ({PROVIDER_LABELS[provider.provider] || provider.provider})
              </span>
            )}
            <span className="inline-flex rounded-full bg-accent/10 px-2 py-1 text-xs text-accent">
              {t("byok.providers.configured")}
            </span>
            {isLocal && (
              <span className="inline-flex rounded-full bg-green/10 px-2 py-1 text-xs text-green">
                {t("byok.providers.local_badge")}
              </span>
            )}
          </div>
          {provider.model && (
            <p className="mt-0.5 text-xs text-text-secondary">
              {t("byok.providers.model_label", { model: provider.model })}
            </p>
          )}
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
