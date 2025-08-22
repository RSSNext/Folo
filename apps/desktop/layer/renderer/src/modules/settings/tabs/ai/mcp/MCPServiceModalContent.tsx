import { Button } from "@follow/components/ui/button/index.js"
import { Input } from "@follow/components/ui/input/index.js"
import { KeyValueEditor } from "@follow/components/ui/key-value-editor/index.js"
import { Label } from "@follow/components/ui/label/index.jsx"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@follow/components/ui/select/index.js"
import type { MCPService } from "@follow/shared/settings/interface"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

interface MCPServiceModalContentProps {
  service?: MCPService | null
  onSave: (service: {
    name: string
    transportType: "streamable-http" | "sse"
    url: string
    headers?: Record<string, string>
  }) => void
  onCancel: () => void
  isLoading?: boolean
}

export const MCPServiceModalContent = ({
  service,
  onSave,
  onCancel,
  isLoading = false,
}: MCPServiceModalContentProps) => {
  const { t } = useTranslation("ai")
  const [name, setName] = useState(service?.name || "")
  const [url, setUrl] = useState(service?.url || "")
  const [transportType, setTransportType] = useState<"streamable-http" | "sse">(
    service?.transportType || "streamable-http",
  )
  const [headers, setHeaders] = useState<Record<string, string>>(service?.headers || {})

  const handleSave = () => {
    if (!name.trim()) {
      toast.error(t("integration.mcp.service.validation.name_required"))
      return
    }

    if (!url.trim()) {
      toast.error(t("integration.mcp.service.validation.baseUrl_required"))
      return
    }

    // Basic URL validation
    try {
      new URL(url.trim())
    } catch {
      toast.error(t("integration.mcp.service.validation.invalid_url"))
      return
    }

    onSave({
      name: name.trim(),
      transportType,
      url: url.trim(),
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label className="text-text text-xs">{t("integration.mcp.service.name")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("integration.mcp.service.name_placeholder")}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-text text-xs">Transport Type</Label>
            <Select
              value={transportType}
              onValueChange={(value) => setTransportType(value as "streamable-http" | "sse")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select transport type" />
              </SelectTrigger>
              <SelectContent position="item-aligned">
                <SelectItem value="streamable-http">Streamable HTTP</SelectItem>
                <SelectItem value="sse">Server-Sent Events</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-text text-xs">URL</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/mcp"
            />
          </div>

          <div className="min-w-[500px] space-y-2">
            <Label className="text-text text-xs">Headers (Optional)</Label>
            <KeyValueEditor
              value={headers}
              onChange={setHeaders}
              keyPlaceholder="Header name"
              valuePlaceholder="Header value"
              addButtonText="Add Header"
              minRows={0}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <i className="i-mgc-loading-3-cute-re mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
