import type { MCPService } from "@follow/shared/settings/interface"
import { useTranslation } from "react-i18next"

import type { ActionButton } from "~/modules/ai-task/components/ai-item-actions"
import { ItemActions } from "~/modules/ai-task/components/ai-item-actions"

interface MCPServiceItemProps {
  service: MCPService
  onDelete: (id: string) => void
  onRefresh: (connectionId: string) => void
  onEdit: (service: MCPService) => void
  onToggleEnabled: (id: string, enabled: boolean) => void
  isDeleting?: boolean
  isRefreshing?: boolean
}

export const MCPServiceItem = ({
  service,
  onDelete,
  onRefresh,
  onEdit,
  onToggleEnabled,
  isDeleting = false,
  isRefreshing = false,
}: MCPServiceItemProps) => {
  const { t } = useTranslation("ai")

  const getConnectionStatusColor = (isConnected: boolean) => {
    return isConnected ? "bg-green/10 text-green" : "bg-gray/10 text-text-tertiary"
  }

  const getConnectionStatusText = (isConnected: boolean) => {
    return isConnected
      ? t("integration.mcp.service.connected")
      : t("integration.mcp.service.disconnected")
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleDateString()
  }

  const actions: ActionButton[] = [
    {
      icon: "i-mgc-edit-cute-re",
      onClick: () => onEdit(service),
      title: "Edit connection",
    },
    {
      icon: "i-mgc-refresh-2-cute-re",
      onClick: () => onRefresh(service.id),
      title: "Refresh tools",
      disabled: isRefreshing,
      loading: isRefreshing,
    },
    {
      icon: "i-mgc-delete-2-cute-re",
      onClick: () => onDelete(service.id),
      title: "Delete service",
      disabled: isDeleting,
      loading: isDeleting,
    },
  ]

  return (
    <div className="hover:bg-material-medium border-border group -ml-3 rounded-lg border p-3 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="text-text text-sm font-medium">{service.name}</h4>
            <div
              className={`rounded-full px-2 py-1 text-xs ${getConnectionStatusColor(service.isConnected)}`}
            >
              {getConnectionStatusText(service.isConnected)}
            </div>
            <div className="bg-blue/10 text-blue rounded-full px-2 py-1 text-xs">
              {service.transportType}
            </div>
          </div>
          <div className="space-y-1">
            {service.url && (
              <p className="text-text-secondary text-xs">
                <span className="text-text-tertiary">URL:</span> {service.url}
              </p>
            )}

            <p className="text-text-secondary text-xs">
              <span className="text-text-tertiary">Tools:</span> {service.toolCount}
              <span className="text-text-tertiary ml-4">Created:</span>{" "}
              {formatDate(service.createdAt)}
              <span className="text-text-tertiary ml-4">Last Used:</span>{" "}
              {formatDate(service.lastUsed)}
            </p>
            {service.lastError && (
              <p className="text-red text-xs">
                <span className="text-text-tertiary">Error:</span> {service.lastError}
              </p>
            )}
          </div>
        </div>

        <ItemActions
          actions={actions}
          enabled={service.enabled}
          onToggle={(enabled) => onToggleEnabled(service.id, enabled)}
        />
      </div>
    </div>
  )
}
