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
    if (!dateString) return t("integration.mcp.service.never")
    return new Date(dateString).toLocaleDateString()
  }

  const actions: ActionButton[] = [
    {
      icon: "i-mgc-edit-cute-re",
      onClick: () => onEdit(service),
      title: t("integration.mcp.service.actions.edit"),
    },
    {
      icon: "i-mgc-refresh-2-cute-re",
      onClick: () => onRefresh(service.id),
      title: t("integration.mcp.service.actions.refresh_tools"),
      disabled: isRefreshing,
      loading: isRefreshing,
    },
    {
      icon: "i-mgc-delete-2-cute-re",
      onClick: () => onDelete(service.id),
      title: t("integration.mcp.service.actions.delete"),
      disabled: isDeleting,
      loading: isDeleting,
    },
  ]

  return (
    <div className="group -ml-3 rounded-lg border border-border p-3 transition-colors hover:bg-material-medium">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-text">{service.name}</h4>
            <div
              className={`rounded-full px-2 py-1 text-xs ${getConnectionStatusColor(service.isConnected)}`}
            >
              {getConnectionStatusText(service.isConnected)}
            </div>
            <div className="rounded-full bg-blue/10 px-2 py-1 text-xs text-blue">
              {service.transportType}
            </div>
          </div>
          <div className="space-y-1">
            {service.url && (
              <p className="text-xs text-text-secondary">
                <span className="text-text-tertiary">
                  {t("integration.mcp.service.fields.url")}
                </span>{" "}
                {service.url}
              </p>
            )}

            <p className="text-xs text-text-secondary">
              <span className="text-text-tertiary">
                {t("integration.mcp.service.fields.tools")}
              </span>{" "}
              {service.toolCount}
              <span className="ml-4 text-text-tertiary">
                {t("integration.mcp.service.fields.created")}
              </span>{" "}
              {formatDate(service.createdAt)}
              <span className="ml-4 text-text-tertiary">
                {t("integration.mcp.service.fields.last_used")}
              </span>{" "}
              {formatDate(service.lastUsed)}
            </p>
            {service.lastError && (
              <p className="text-xs text-red">
                <span className="text-text-tertiary">
                  {t("integration.mcp.service.fields.error")}
                </span>{" "}
                {service.lastError}
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
