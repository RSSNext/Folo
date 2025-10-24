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
          <div className="group rounded-lg border border-fill-secondary bg-material-medium p-4 transition-all hover:border-accent hover:bg-fill-quaternary hover:shadow-md">
            <div className="flex flex-col items-center space-y-3 text-center">
              <div className="flex size-12 items-center justify-center">
                <i className="i-mgc-settings-7-cute-re size-8 text-text" />
              </div>

              <h3 className="text-sm font-medium text-text">Custom</h3>

              <p className="text-xs leading-relaxed text-text-secondary">
                Manual configuration for other MCP services
              </p>

              <div className="w-full space-y-1">
                <div className="flex items-center text-left text-xs text-text">
                  <span className="mr-2 text-accent">•</span>
                  <span>Custom URL & settings</span>
                </div>
                <div className="flex items-center text-left text-xs text-text">
                  <span className="mr-2 text-accent">•</span>
                  <span>Advanced configuration</span>
                </div>
                <div className="flex items-center text-left text-xs text-text">
                  <span className="mr-2 text-accent">•</span>
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
      <div className="rounded-lg bg-fill-secondary/50 p-4">
        <div className="flex items-start space-x-3">
          <i className="i-mgc-information-cute-re mt-0.5 size-4 text-text-secondary" />
          <div className="space-y-1">
            <p className="text-xs font-medium text-text">More services coming soon</p>
            <p className="text-xs text-text-secondary">
              You can use the custom configuration option for any MCP-compatible service.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
