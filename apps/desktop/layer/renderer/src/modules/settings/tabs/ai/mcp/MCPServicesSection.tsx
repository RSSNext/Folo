import { Button } from "@follow/components/ui/button/index.js"
import { Label } from "@follow/components/ui/label/index.jsx"
import { Switch } from "@follow/components/ui/switch/index.jsx"
import type { MCPService } from "@follow/shared/settings/interface"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { setMCPEnabled, useMCPEnabled } from "~/atoms/settings/ai"
import { useDialog, useModalStack } from "~/components/ui/modal/stacked/hooks"
import {
  createMCPConnection,
  deleteMCPConnection,
  fetchMCPConnections,
  mcpQueryKeys,
  refreshMCPTools,
  updateMCPConnection,
} from "~/queries/mcp"

import { MCPServiceItem } from "./MCPServiceItem"
import { MCPServiceModalContent } from "./MCPServiceModalContent"

export const MCPServicesSection = () => {
  const { t } = useTranslation("ai")
  const mcpEnabled = useMCPEnabled()
  const queryClient = useQueryClient()
  const dialog = useDialog()

  // Reusable OAuth authorization handler using dialog
  const handleOAuthAuthorization = async (authorizationUrl: string, connectionId?: string) => {
    const confirmed = await dialog.ask({
      title: t("integration.mcp.service.auth_required"),
      message: t("integration.mcp.service.auth_message"),
      confirmText: t("integration.mcp.service.open_auth"),
      cancelText: t("words.cancel", { ns: "common" }),
      variant: "ask",
    })

    if (confirmed) {
      const popup = window.open(
        authorizationUrl,
        "_blank",
        "width=600,height=700,scrollbars=yes,resizable=yes",
      )

      if (!popup) {
        toast.error(t("integration.mcp.service.popup_blocked"))
      } else {
        popup.onclose = () => {
          // FIXME
          setTimeout(() => {
            refreshToolsMutation.mutate(connectionId ? [connectionId] : undefined)
          }, 3000)
        }
      }
    }
  }

  // Query for MCP connections
  const {
    data: mcpServices = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: mcpQueryKeys.connections(),
    queryFn: fetchMCPConnections,
    enabled: mcpEnabled,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    retry: 2,
  })

  // Mutation for creating MCP connection
  const createConnectionMutation = useMutation({
    mutationFn: createMCPConnection,
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: mcpQueryKeys.connections() })

      // Handle OAuth authorization if needed
      if (result.authorizationUrl) {
        await handleOAuthAuthorization(result.authorizationUrl, result.connectionId)
      } else {
        toast.success(t("integration.mcp.service.added"))
        refreshToolsMutation.mutate([result.connectionId])
      }
    },
    onError: (error) => {
      toast.error(t("integration.mcp.service.discovery_failed"))
      console.error("Failed to create MCP connection:", error)
    },
  })

  // Mutation for updating MCP connection
  const updateConnectionMutation = useMutation({
    mutationFn: ({
      connectionId,
      updateData,
    }: {
      connectionId: string
      updateData: Parameters<typeof updateMCPConnection>[1]
    }) => updateMCPConnection(connectionId, updateData),
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: mcpQueryKeys.connections() })

      // Handle OAuth authorization if needed
      if (result.authorizationUrl) {
        await handleOAuthAuthorization(result.authorizationUrl, result.connectionId)
      } else {
        toast.success(t("integration.mcp.service.updated"))
        refreshToolsMutation.mutate([result.connectionId])
      }
    },
    onError: (error) => {
      toast.error("Failed to update MCP connection")
      console.error("Failed to update MCP connection:", error)
    },
  })

  // Mutation for deleting MCP connection
  const deleteConnectionMutation = useMutation({
    mutationFn: deleteMCPConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mcpQueryKeys.connections() })
      toast.success(t("integration.mcp.service.deleted"))
    },
    onError: (error) => {
      toast.error("Failed to delete MCP connection")
      console.error("Failed to delete MCP connection:", error)
    },
  })

  // Mutation for refreshing MCP tools
  const refreshToolsMutation = useMutation({
    mutationFn: (connectionIds?: string[]) => refreshMCPTools(connectionIds),
    onSuccess: () => {
      // Invalidate both connections (for updated counts) and tools queries
      queryClient.invalidateQueries({ queryKey: mcpQueryKeys.connections() })
      queryClient.invalidateQueries({ queryKey: mcpQueryKeys.all })
      toast.success("MCP tools refreshed successfully")
    },
    onError: (error) => {
      toast.error("Failed to refresh MCP tools")
      console.error("Failed to refresh MCP tools:", error)
    },
  })

  const { present } = useModalStack()
  const handleAddService = () => {
    present({
      title: "Add MCP Service",
      content: ({ dismiss }: { dismiss: () => void }) => (
        <MCPServiceModalContent
          service={null}
          onSave={(service) => {
            createConnectionMutation.mutate(service)
            dismiss()
          }}
          onCancel={dismiss}
          isLoading={createConnectionMutation.isPending}
        />
      ),
    })
  }

  const handleEditService = (service: MCPService) => {
    present({
      title: "Edit MCP Service",
      content: ({ dismiss }: { dismiss: () => void }) => (
        <MCPServiceModalContent
          service={service}
          onSave={(updatedService) => {
            updateConnectionMutation.mutate({
              connectionId: service.id,
              updateData: updatedService,
            })
            dismiss()
          }}
          onCancel={dismiss}
          isLoading={updateConnectionMutation.isPending}
        />
      ),
    })
  }

  const handleDeleteService = (id: string) => {
    deleteConnectionMutation.mutate(id)
  }

  const handleRefreshTools = (connectionId?: string) => {
    refreshToolsMutation.mutate(connectionId ? [connectionId] : undefined)
  }

  // Show error message if query failed
  React.useEffect(() => {
    if (error) {
      toast.error("Failed to load MCP connections")
      console.error("Failed to load MCP connections:", error)
    }
  }, [error])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-text text-sm font-medium">{t("integration.mcp.enabled")}</Label>
            <div className="text-text-secondary text-xs">{t("integration.mcp.description")}</div>
          </div>
          <Switch checked={mcpEnabled} onCheckedChange={setMCPEnabled} />
        </div>
      </div>

      {mcpEnabled && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-text text-sm font-medium">
              {t("integration.mcp.services.title")}
            </Label>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                title="Refresh connections"
              >
                {isLoading ? (
                  <i className="i-mgc-loading-3-cute-re size-4 animate-spin" />
                ) : (
                  <i className="i-mgc-refresh-2-cute-re size-4" />
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={handleAddService}>
                <i className="i-mgc-add-cute-re mr-2 size-4" />
                {t("integration.mcp.services.add")}
              </Button>
            </div>
          </div>

          {mcpServices.length === 0 && (
            <div className="py-8 text-center">
              <div className="bg-fill-secondary mx-auto mb-3 flex size-12 items-center justify-center rounded-full">
                <i className="i-mgc-plugin-2-cute-re text-text size-6" />
              </div>
              <h4 className="text-text mb-1 text-sm font-medium">
                {t("integration.mcp.services.empty.title")}
              </h4>
              <p className="text-text-secondary text-xs">
                {t("integration.mcp.services.empty.description")}
              </p>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <i className="i-mgc-loading-3-cute-re size-6 animate-spin" />
            </div>
          )}

          {mcpServices.map((service) => (
            <MCPServiceItem
              key={service.id}
              service={service}
              onDelete={handleDeleteService}
              onRefresh={handleRefreshTools}
              onEdit={handleEditService}
              isDeleting={
                deleteConnectionMutation.isPending &&
                deleteConnectionMutation.variables === service.id
              }
              isRefreshing={
                refreshToolsMutation.isPending && refreshToolsMutation.variables?.[0] === service.id
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
