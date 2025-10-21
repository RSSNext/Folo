import { Button } from "@follow/components/ui/button/index.js"

import type { MCPPreset } from "./types"

interface MCPPresetCardProps {
  preset: MCPPreset
  onSelect: (preset: MCPPreset) => void
}

export const MCPPresetCard = ({ preset, onSelect }: MCPPresetCardProps) => {
  return (
    <div className="group rounded-lg border border-fill-secondary bg-material-medium p-4 transition-all hover:border-accent hover:bg-fill-quaternary hover:shadow-md">
      <div className="flex flex-col items-center space-y-3 text-center">
        {/* Icon */}
        <div className="flex size-12 items-center justify-center">
          <i className={`${preset.icon} size-8 text-text`} />
        </div>

        {/* Service Name */}
        <h3 className="text-sm font-medium text-text">{preset.displayName}</h3>

        {/* Description */}
        <p className="text-xs leading-relaxed text-text-secondary">{preset.description}</p>

        {/* Features */}
        <div className="w-full space-y-1">
          {preset.features.map((feature) => (
            <div key={feature} className="flex items-center text-left text-xs text-text">
              <span className="mr-2 text-accent">•</span>
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
          <div className="flex items-center text-xs text-text-secondary">
            <i className="i-mgc-user-setting-cute-re mr-1 size-3" />
            <span>Authentication required</span>
          </div>
        )}
      </div>
    </div>
  )
}
