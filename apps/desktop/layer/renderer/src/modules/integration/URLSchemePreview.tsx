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
            <div className="bg-material-medium flex items-center justify-center rounded-lg p-4">
              <div className="flex items-center gap-2">
                <i className="i-mgc-loading-3-cute-re animate-spin" />
                <span className="text-text-tertiary text-sm">Generating preview...</span>
              </div>
            </div>
          ) : preview ? (
            <div className="bg-material-medium space-y-3 rounded-lg p-4">
              {/* URL Scheme Preview */}
              <div>
                <h4 className="text-text-secondary mb-2 text-sm font-medium">
                  Generated URL Scheme
                </h4>
                <div className="bg-material-medium flex items-center gap-2 rounded p-2 font-mono text-sm">
                  <span className="bg-green/10 text-green rounded px-2 py-1 text-xs font-bold">
                    SCHEME
                  </span>
                  <span className="text-text-secondary break-all">{preview}</span>
                </div>
              </div>

              {/* Protocol Info */}
              <div>
                <h4 className="text-text-secondary mb-2 text-sm font-medium">
                  Protocol Information
                </h4>
                <div className="bg-material-medium space-y-1 rounded p-2">
                  <div className="flex font-mono text-sm">
                    <span className="text-text-secondary min-w-0 flex-shrink-0 pr-2">
                      Protocol:
                    </span>
                    <span className="text-text-tertiary min-w-0 flex-1 break-all">
                      {preview.split("://")[0]}://
                    </span>
                  </div>
                  <div className="flex font-mono text-sm">
                    <span className="text-text-secondary min-w-0 flex-shrink-0 pr-2">Action:</span>
                    <span className="text-text-tertiary min-w-0 flex-1 break-all">
                      {preview.includes("?") ? "Open with parameters" : "Direct open"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Placeholders Info */}
              <div className="border-border border-t pt-3">
                <h4 className="text-text-secondary mb-2 text-sm font-medium">
                  Available Placeholders for URL Schemes
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {CustomIntegrationManager.getAvailablePlaceholders().map((placeholder) => (
                    <div key={placeholder.key} className="bg-material-opaque rounded p-2">
                      <code className="text-text font-bold">{placeholder.key}</code>
                      <div className="text-text-tertiary mt-1">{placeholder.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Usage Note */}
              <div className="bg-blue/10 border-blue/20 rounded border p-3">
                <div className="flex items-start gap-2">
                  <i className="i-mgc-information-cute-re text-blue mt-0.5 flex-shrink-0" />
                  <div className="text-blue text-sm">
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
            <div className="bg-material-medium flex items-center justify-center rounded-lg p-4">
              <span className="text-text-tertiary text-sm">Failed to generate preview</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
