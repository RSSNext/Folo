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
        className="p-0 text-text-tertiary transition-colors hover:text-text"
      >
        <span className="flex items-center gap-1 text-xs">
          <i className="i-mgc-question-cute-re" />
          {t("integration.custom_integrations.placeholders.help", "Available Placeholders")}
          <i className={cn("i-mgc-right-cute-re transition-transform", isOpen && "rotate-90")} />
        </span>
      </button>

      {isOpen && (
        <div className="space-y-2">
          <div className="rounded-lg bg-fill-secondary p-3">
            <p className="mb-3 text-xs text-text-tertiary">
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
                      className="group flex items-start gap-2 rounded bg-fill p-2 text-left transition-colors hover:bg-fill-secondary"
                    >
                      <code className="rounded bg-blue/10 px-1.5 py-0.5 font-mono text-xs text-blue transition-colors group-hover:bg-blue/20">
                        {placeholder.key}
                      </code>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-text">
                          {placeholder.description}
                        </div>
                        {placeholder.example && (
                          <div className="mt-1 text-xs text-text-tertiary">
                            Example: {placeholder.example}
                          </div>
                        )}
                      </div>
                      <i className="i-mgc-copy-cute-re text-text-tertiary opacity-0 transition-opacity group-hover:text-text group-hover:opacity-100" />
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
