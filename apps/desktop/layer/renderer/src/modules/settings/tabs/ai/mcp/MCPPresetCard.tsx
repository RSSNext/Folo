import { Button } from "@follow/components/ui/button/index.js"

import type { MCPPreset } from "./types"

interface MCPPresetCardProps {
  preset: MCPPreset
  onSelect: (preset: MCPPreset) => void
}

export const MCPPresetCard = ({ preset, onSelect }: MCPPresetCardProps) => {
  return (
    <div className="border-fill-secondary bg-material-medium hover:border-accent hover:bg-fill-quaternary group rounded-lg border p-4 transition-all hover:shadow-md">
      <div className="flex flex-col items-center space-y-3 text-center">
        {/* Icon */}
        <div className="flex size-12 items-center justify-center">
          <i className={`${preset.icon} text-text size-8`} />
        </div>

        {/* Service Name */}
        <h3 className="text-text text-sm font-medium">{preset.displayName}</h3>

        {/* Description */}
        <p className="text-text-secondary text-xs leading-relaxed">{preset.description}</p>

        {/* Features */}
        <div className="w-full space-y-1">
          {preset.features.map((feature) => (
            <div key={feature} className="text-text flex items-center text-left text-xs">
              <span className="text-accent mr-2">•</span>
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <Button
          size="sm"
          buttonClassName="w-full bg-accent text-white hover:bg-accent/90"
          onClick={() => onSelect(preset)}
        >
          Quick Setup
        </Button>

        {/* Auth Required Indicator */}
        {preset.authRequired && (
          <div className="text-text-secondary flex items-center text-xs">
            <i className="i-mgc-user-setting-cute-re mr-1 size-3" />
            <span>Authentication required</span>
          </div>
        )}
      </div>
    </div>
  )
}
