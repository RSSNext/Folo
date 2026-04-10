import { Button } from "@follow/components/ui/button/index.js"
import { Input } from "@follow/components/ui/input/index.js"
import type { ByokProviderName } from "@follow/shared/settings/interface"
import { useCallback, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import type { DiscoveredModel } from "./model-discovery"
import { discoverModels } from "./model-discovery"

interface ModelSelectorProps {
  provider: ByokProviderName
  baseURL: string
  apiKey?: string | null
  value: string
  onChange: (model: string) => void
  supportsDiscovery: boolean
}

export const ModelSelector = ({
  provider,
  baseURL,
  apiKey,
  value,
  onChange,
  supportsDiscovery,
}: ModelSelectorProps) => {
  const { t } = useTranslation("ai")
  const [models, setModels] = useState<DiscoveredModel[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [search, setSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleFetchModels = useCallback(async () => {
    if (!baseURL && !apiKey) return

    setIsLoading(true)
    setError(null)

    try {
      const discovered = await discoverModels(provider, baseURL, apiKey)
      setModels(discovered)
      if (discovered.length > 0) {
        setShowDropdown(true)
      } else {
        setError(t("byok.providers.form.no_models_found"))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch models")
      setModels([])
    } finally {
      setIsLoading(false)
    }
  }, [provider, baseURL, apiKey, t])

  const filteredModels = useMemo(() => {
    if (!search) return models
    const lower = search.toLowerCase()
    return models.filter(
      (m) =>
        m.id.toLowerCase().includes(lower) ||
        m.name.toLowerCase().includes(lower) ||
        m.description?.toLowerCase().includes(lower),
    )
  }, [models, search])

  const handleSelectModel = useCallback(
    (model: DiscoveredModel) => {
      onChange(model.id)
      setShowDropdown(false)
      setSearch("")
    },
    [onChange],
  )

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          type="text"
          placeholder={t("byok.providers.form.model_placeholder")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (models.length > 0) setShowDropdown(true)
          }}
        />
        {supportsDiscovery && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading || (!baseURL && !apiKey)}
            onClick={handleFetchModels}
            buttonClassName="shrink-0"
          >
            {isLoading ? (
              <>
                <i className="i-mgc-loading-3-cute-re size-4 animate-spin" />
                <span className="ml-1">{t("byok.providers.form.fetching_models")}</span>
              </>
            ) : (
              t("byok.providers.form.fetch_models")
            )}
          </Button>
        )}
      </div>

      {error && <p className="text-xs text-red">{error}</p>}

      {models.length > 0 && !error && (
        <p className="text-xs text-text-secondary">
          {t("byok.providers.form.models_fetched", { count: models.length })}
        </p>
      )}

      {showDropdown && models.length > 0 && (
        <div
          ref={dropdownRef}
          className="max-h-48 overflow-y-auto rounded-md border border-border bg-popover"
        >
          {models.length > 10 && (
            <div className="sticky top-0 border-b border-border bg-popover p-1">
              <Input
                type="text"
                placeholder="Search models..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
          )}
          {filteredModels.map((model) => (
            <button
              key={model.id}
              type="button"
              className="flex w-full flex-col px-3 py-1.5 text-left hover:bg-fill-secondary"
              onClick={() => handleSelectModel(model)}
            >
              <span className="text-xs font-medium text-text">{model.name}</span>
              {model.description && (
                <span className="line-clamp-1 text-[10px] text-text-secondary">
                  {model.description}
                </span>
              )}
            </button>
          ))}
          {filteredModels.length === 0 && (
            <div className="px-3 py-2 text-xs text-text-secondary">No matching models</div>
          )}
        </div>
      )}
    </div>
  )
}
