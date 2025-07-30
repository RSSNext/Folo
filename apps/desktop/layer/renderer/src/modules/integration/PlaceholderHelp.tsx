import { Tooltip, TooltipContent, TooltipTrigger } from "@follow/components/ui/tooltip/index.js"
import { cn } from "@follow/utils"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { CustomIntegrationManager } from "./custom-integration-manager"

interface PlaceholderHelpProps {
  className?: string
  onPlaceholderClick?: (placeholder: string) => void
}

export const PlaceholderHelp = ({ className, onPlaceholderClick }: PlaceholderHelpProps) => {
  const { t } = useTranslation("settings")
  const [isOpen, setIsOpen] = useState(false)

  const placeholders = CustomIntegrationManager.getAvailablePlaceholders()

  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-text-tertiary hover:text-text p-0 transition-colors"
      >
        <span className="flex items-center gap-1 text-xs">
          <i className="i-mgc-question-cute-re" />
          {t("integration.custom_integrations.placeholders.help", "Available Placeholders")}
          <i className={cn("i-mgc-right-cute-re transition-transform", isOpen && "rotate-90")} />
        </span>
      </button>

      {isOpen && (
        <div className="space-y-2">
          <div className="bg-fill-secondary rounded-lg p-3">
            <p className="text-text-tertiary mb-3 text-xs">
              {t(
                "integration.custom_integrations.placeholders.description",
                "Click on any placeholder to copy it to your clipboard",
              )}
            </p>

            <div className="grid grid-cols-1 gap-2">
              {placeholders.map((placeholder) => (
                <Tooltip key={placeholder.key}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => {
                        if (onPlaceholderClick) {
                          onPlaceholderClick(placeholder.key)
                        } else {
                          navigator.clipboard?.writeText(placeholder.key)
                        }
                      }}
                      className="bg-fill hover:bg-fill-secondary group flex items-start gap-2 rounded p-2 text-left transition-colors"
                    >
                      <code className="text-blue bg-blue/10 group-hover:bg-blue/20 rounded px-1.5 py-0.5 font-mono text-xs transition-colors">
                        {placeholder.key}
                      </code>
                      <div className="min-w-0 flex-1">
                        <div className="text-text text-xs font-medium">
                          {placeholder.description}
                        </div>
                        {placeholder.example && (
                          <div className="text-text-tertiary mt-1 text-xs">
                            Example: {placeholder.example}
                          </div>
                        )}
                      </div>
                      <i className="i-mgc-copy-cute-re text-text-tertiary group-hover:text-text opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {t(
                        "integration.custom_integrations.placeholders.click_to_copy",
                        "Click to copy",
                      )}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
