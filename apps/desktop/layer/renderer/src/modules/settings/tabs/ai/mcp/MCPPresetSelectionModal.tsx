import { Button } from "@follow/components/ui/button/index.js"

import { MCPPresetCard } from "./MCPPresetCard"
import type { MCPPreset } from "./types"
import { MCP_PRESETS } from "./types"

interface MCPPresetSelectionModalProps {
  onPresetSelected: (preset: MCPPreset) => void
  onManualConfig: () => void
}

export const MCPPresetSelectionModal = ({
  onPresetSelected,
  onManualConfig,
}: MCPPresetSelectionModalProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MCP_PRESETS.map((preset) => (
            <MCPPresetCard key={preset.id} preset={preset} onSelect={onPresetSelected} />
          ))}

          {/* Custom/Manual Configuration Card */}
          <div className="border-fill-secondary bg-material-medium hover:border-accent hover:bg-fill-quaternary group rounded-lg border p-4 transition-all hover:shadow-md">
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
              You can use the custom configuration option for any MCP-compatible service.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
