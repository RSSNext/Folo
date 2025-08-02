import { Button } from "@follow/components/ui/button/index.js"
import type { FetchTemplate } from "@follow/shared/settings/interface"
import { cn } from "@follow/utils"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { CustomIntegrationManager } from "./custom-integration-manager"

interface CustomIntegrationPreviewProps {
  fetchTemplate: FetchTemplate
  className?: string
}

export const CustomIntegrationPreview = ({
  fetchTemplate,
  className,
}: CustomIntegrationPreviewProps) => {
  const { t } = useTranslation("settings")
  const [preview, setPreview] = useState<{
    url: string
    headers: Record<string, string>
    body?: string
    method: string
  } | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const generatePreview = async (fetchTemplate: FetchTemplate) => {
    setIsLoading(true)
    try {
      const previewData = await CustomIntegrationManager.getTemplatePreview(fetchTemplate)

      setPreview(previewData)
    } catch (error) {
      console.error("Failed to generate preview:", error)
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
            generatePreview(fetchTemplate)
          }
        }}
      >
        <span className="flex items-center gap-2">
          <i className="i-mingcute-eye-line" />
          {t("integration.custom_integrations.preview.title", "Preview Request")}
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
              {/* Method and URL */}
              <div>
                <h4 className="text-text-secondary mb-2 text-sm font-medium">Request</h4>
                <div className="bg-material-medium flex items-center gap-2 rounded p-2 font-mono text-sm">
                  <span className="bg-blue/10 text-blue rounded px-2 py-1 text-xs font-bold">
                    {preview.method}
                  </span>
                  <span className="text-text-secondary break-all">{preview.url}</span>
                </div>
              </div>

              {/* Headers */}
              {Object.keys(preview.headers).length > 0 && (
                <div>
                  <h4 className="text-text-secondary mb-2 text-sm font-medium">Headers</h4>
                  <div className="bg-material-medium space-y-1 rounded p-2">
                    {Object.entries(preview.headers).map(([key, value]) => (
                      <div key={key} className="flex font-mono text-sm">
                        <span className="text-text-secondary min-w-0 flex-shrink-0 pr-2">
                          {key}:
                        </span>
                        <span className="text-text-tertiary min-w-0 flex-1 break-all">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Body */}
              {preview.body && (
                <div>
                  <h4 className="text-text-secondary mb-2 text-sm font-medium">Request Body</h4>
                  <div className="bg-material-medium max-h-40 overflow-auto rounded p-2">
                    <pre className="text-text-secondary whitespace-pre-wrap font-mono text-sm">
                      {preview.body}
                    </pre>
                  </div>
                </div>
              )}

              {/* Placeholders Info */}
              <div className="border-border border-t pt-3">
                <h4 className="text-text-secondary mb-2 text-sm font-medium">
                  Available Placeholders
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
