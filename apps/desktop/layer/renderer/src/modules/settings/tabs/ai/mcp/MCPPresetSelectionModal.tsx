import { Button } from "@follow/components/ui/button/index.js"
import { Label } from "@follow/components/ui/label/index.jsx"
import { useTranslation } from "react-i18next"

import { MCPPresetCard } from "./MCPPresetCard"
import type { MCPPreset } from "./types"
import { MCP_PRESETS } from "./types"

interface MCPPresetSelectionModalProps {
  onPresetSelected: (preset: MCPPreset) => void
  onManualConfig: () => void
  onCancel: () => void
  isLoading?: boolean
}

export const MCPPresetSelectionModal = ({
  onPresetSelected,
  onManualConfig,
  onCancel,
  isLoading,
}: MCPPresetSelectionModalProps) => {
  const { t } = useTranslation("ai")

  const popularPresets = MCP_PRESETS.filter((preset) => preset.category === "popular")

  return (
    <div className="space-y-6">
      {/* Popular Services Section */}
      <div className="space-y-4">
        <Label className="text-text text-sm font-medium">
          <i className="i-mgc-star-cute-re mr-2 size-4" />
          Popular Services
        </Label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {popularPresets.map((preset) => (
            <MCPPresetCard
              key={preset.id}
              preset={preset}
              onSelect={onPresetSelected}
              isLoading={isLoading}
            />
          ))}

          {/* Custom/Manual Configuration Card */}
          <div className="border-fill-secondary bg-fill hover:border-accent hover:bg-fill-secondary group rounded-lg border p-4 transition-all hover:shadow-md">
            <div className="flex flex-col items-center space-y-3 text-center">
              <div className="flex size-12 items-center justify-center">
                <i className="i-mgc-settings-7-cute-re text-text size-8" />
              </div>

              <h3 className="text-text text-sm font-medium">Custom</h3>

              <p className="text-text-secondary text-xs leading-relaxed">
                Manual configuration for other MCP services
              </p>

              <div className="w-full space-y-1">
                <div className="text-text flex items-center text-left text-xs">
                  <span className="text-accent mr-2">•</span>
                  <span>Custom URL & settings</span>
                </div>
                <div className="text-text flex items-center text-left text-xs">
                  <span className="text-accent mr-2">•</span>
                  <span>Advanced configuration</span>
                </div>
                <div className="text-text flex items-center text-left text-xs">
                  <span className="text-accent mr-2">•</span>
                  <span>Full control</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                buttonClassName="w-full border-accent text-accent hover:bg-accent hover:text-white"
                onClick={onManualConfig}
              >
                Configure
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Future Services Hint */}
      <div className="bg-fill-secondary/50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <i className="i-mgc-information-cute-re text-text-secondary mt-0.5 size-4" />
          <div className="space-y-1">
            <p className="text-text text-xs font-medium">More services coming soon</p>
            <p className="text-text-secondary text-xs">
              We're working on adding presets for GitHub, Slack, Discord, and other popular
              services. For now, you can use the custom configuration option for any MCP-compatible
              service.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end space-x-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          {t("words.cancel", { ns: "common" })}
        </Button>
      </div>
    </div>
  )
}
