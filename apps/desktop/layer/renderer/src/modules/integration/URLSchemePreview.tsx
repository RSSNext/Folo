import { Button } from "@follow/components/ui/button/index.js"
import type { URLSchemeTemplate } from "@follow/shared/settings/interface"
import { cn } from "@follow/utils"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { CustomIntegrationManager } from "./custom-integration-manager"

interface URLSchemePreviewProps {
  urlSchemeTemplate: URLSchemeTemplate
  className?: string
}

export const URLSchemePreview = ({ urlSchemeTemplate, className }: URLSchemePreviewProps) => {
  const { t } = useTranslation("settings")
  const [preview, setPreview] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const generatePreview = async (template: URLSchemeTemplate) => {
    setIsLoading(true)
    try {
      const previewScheme = CustomIntegrationManager.getURLSchemePreview(template)
      setPreview(previewScheme)
    } catch (error) {
      console.error("Failed to generate URL scheme preview:", error)
      setPreview(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        buttonClassName="w-full py-2"
        textClassName="flex w-full justify-between"
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) {
            generatePreview(urlSchemeTemplate)
          }
        }}
      >
        <span className="flex items-center gap-2">
          <i className="i-mingcute-eye-line" />
          {t("integration.custom_integrations.preview.title", "Preview URL Scheme")}
        </span>
        <i className={cn("i-mgc-right-cute-re transition-transform", isOpen && "rotate-90")} />
      </Button>

      {isOpen && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center rounded-lg bg-material-medium p-4">
              <div className="flex items-center gap-2">
                <i className="i-mgc-loading-3-cute-re animate-spin" />
                <span className="text-sm text-text-tertiary">Generating preview...</span>
              </div>
            </div>
          ) : preview ? (
            <div className="space-y-3 rounded-lg bg-material-medium p-4">
              {/* URL Scheme Preview */}
              <div>
                <h4 className="mb-2 text-sm font-medium text-text-secondary">
                  Generated URL Scheme
                </h4>
                <div className="flex items-center gap-2 rounded bg-material-medium p-2 font-mono text-sm">
                  <span className="rounded bg-green/10 px-2 py-1 text-xs font-bold text-green">
                    SCHEME
                  </span>
                  <span className="break-all text-text-secondary">{preview}</span>
                </div>
              </div>

              {/* Protocol Info */}
              <div>
                <h4 className="mb-2 text-sm font-medium text-text-secondary">
                  Protocol Information
                </h4>
                <div className="space-y-1 rounded bg-material-medium p-2">
                  <div className="flex font-mono text-sm">
                    <span className="min-w-0 flex-shrink-0 pr-2 text-text-secondary">
                      Protocol:
                    </span>
                    <span className="min-w-0 flex-1 break-all text-text-tertiary">
                      {preview.split("://")[0]}://
                    </span>
                  </div>
                  <div className="flex font-mono text-sm">
                    <span className="min-w-0 flex-shrink-0 pr-2 text-text-secondary">Action:</span>
                    <span className="min-w-0 flex-1 break-all text-text-tertiary">
                      {preview.includes("?") ? "Open with parameters" : "Direct open"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Placeholders Info */}
              <div className="border-t border-border pt-3">
                <h4 className="mb-2 text-sm font-medium text-text-secondary">
                  Available Placeholders for URL Schemes
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {CustomIntegrationManager.getAvailablePlaceholders().map((placeholder) => (
                    <div key={placeholder.key} className="rounded bg-material-opaque p-2">
                      <code className="font-bold text-text">{placeholder.key}</code>
                      <div className="mt-1 text-text-tertiary">{placeholder.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Usage Note */}
              <div className="rounded border border-blue/20 bg-blue/10 p-3">
                <div className="flex items-start gap-2">
                  <i className="i-mgc-information-cute-re mt-0.5 flex-shrink-0 text-blue" />
                  <div className="text-sm text-blue">
                    <div className="mb-1 font-medium">URL Scheme Behavior</div>
                    <div className="text-blue/80">
                      URL schemes will attempt to open the target application with the provided
                      data. Make sure the application is installed and registered for the URL scheme
                      on your system.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-lg bg-material-medium p-4">
              <span className="text-sm text-text-tertiary">Failed to generate preview</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
