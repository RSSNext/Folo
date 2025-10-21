import { Button } from "@follow/components/ui/button/index.js"
import { Label } from "@follow/components/ui/label/index.jsx"
import { Switch } from "@follow/components/ui/switch/index.jsx"
import type { WithOptimistic } from "@follow/hooks"
import { createOptimisticConfig, useOptimisticMutation } from "@follow/hooks"
import type { MCPService } from "@follow/shared/settings/interface"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useEventListener } from "usehooks-ts"

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

import { MCPPresetSelectionModal } from "./MCPPresetSelectionModal"
import { MCPServiceItem } from "./MCPServiceItem"
import { MCPServiceModalContent } from "./MCPServiceModalContent"

// Use the generic optimistic wrapper type
type OptimisticMCPService = WithOptimistic<MCPService>

export const MCPServicesSection = () => {
  const { t } = useTranslation("ai")
  const mcpEnabled = useMCPEnabled()
  const queryClient = useQueryClient()
  const dialog = useDialog()

  const shouldWindowFocusRefetchRef = React.useRef(false)

  // Reusable OAuth authorization handler using dialog
  const handleOAuthAuthorization = async (authorizationUrl: string, _connectionId?: string) => {
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
        "width=600,height=700,scrollbars=yes,resizable=yes,popup=yes",
      )

      if (!popup) {
        toast.error(t("integration.mcp.service.popup_blocked"))
      } else {
        shouldWindowFocusRefetchRef.current = true
      }
    }
  }

  useEventListener("focus", () => {
    if (shouldWindowFocusRefetchRef.current) {
      shouldWindowFocusRefetchRef.current = false
      refetch()
    }
  })

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
    retry: 2,
  })

  // Optimistic mutation for creating MCP connection
  const createConnectionMutation = useOptimisticMutation(
    createOptimisticConfig.custom<OptimisticMCPService, Parameters<typeof createMCPConnection>[0]>({
      mutationFn: createMCPConnection,
      queryKey: mcpQueryKeys.connections(),
      optimisticUpdater: (variables, previousData) => {
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
        const optimisticService: OptimisticMCPService = {
          id: tempId,
          name: variables.name || "New Service",
          transportType: variables.transportType,
          url: variables.url,
          headers: variables.headers,
          isConnected: false,
          enabled: true,
          toolCount: 0,
          resourceCount: 0,
          promptCount: 0,
          createdAt: new Date().toISOString(),
          lastUsed: null,
        }

        return {
          newData: [optimisticService, ...previousData],
          rollbackData: previousData,
          tempId,
        }
      },
      successUpdater: (result: any, _variables, previousData, context: any) => {
        // Handle the API response structure
        return previousData.map((service) => {
          if (service.id === context?.tempId) {
            // Merge the response data with optimistic data
            return {
              ...service,
              id: result.connectionId || result.id || service.id,
              isConnected: true,
              status: "connected" as const,
              isOptimistic: false,
            }
          }
          return service
        })
      },
      onSuccess: async (result: any) => {
        if (result.authorizationUrl) {
          await handleOAuthAuthorization(result.authorizationUrl, result.connectionId)
        } else {
          toast.success(t("integration.mcp.service.added"))
          refreshToolsMutation.mutate([result.connectionId])
        }
      },
      errorConfig: {
        showToast: true,
        customMessage: t("integration.mcp.service.discovery_failed"),
        retryable: false,
      },
    }),
  )

  // Optimistic mutation for updating MCP connection
  const updateConnectionMutation = useOptimisticMutation(
    createOptimisticConfig.custom<
      OptimisticMCPService,
      {
        connectionId: string
        updateData: Parameters<typeof updateMCPConnection>[1]
      }
    >({
      mutationFn: (({ connectionId, updateData }) =>
        updateMCPConnection(connectionId, updateData)) as any,
      queryKey: mcpQueryKeys.connections(),
      optimisticUpdater: (variables, previousData) => {
        const newData = previousData.map((service) =>
          service.id === variables.connectionId
            ? {
                ...service,
                ...variables.updateData,
                status: "updating" as const,
                isOptimistic: true,
                updatedAt: new Date().toISOString(),
              }
            : service,
        )

        return {
          newData,
          rollbackData: previousData,
          targetId: variables.connectionId,
        }
      },
      successUpdater: (result: any, variables, previousData) => {
        return previousData.map((service) =>
          service.id === variables.connectionId
            ? {
                ...service,
                ...result,
                id: variables.connectionId, // Keep the original ID
                status: "connected" as const,
                isOptimistic: false,
              }
            : service,
        )
      },
      onSuccess: async (result: any) => {
        if (result.authorizationUrl) {
          await handleOAuthAuthorization(result.authorizationUrl, result.connectionId)
        } else {
          toast.success(t("integration.mcp.service.updated"))
          refreshToolsMutation.mutate([result.connectionId])
        }
      },
      errorConfig: {
        showToast: true,
        customMessage: "Failed to update MCP connection",
        retryable: false,
      },
    }),
  )

  // Optimistic mutation for toggling connection enabled status
  const toggleConnectionMutation = useOptimisticMutation(
    createOptimisticConfig.forToggle<
      OptimisticMCPService,
      { connectionId: string; enabled: boolean },
      any // API response type
    >({
      mutationFn: ({ connectionId, enabled }) => updateMCPConnection(connectionId, { enabled }),
      queryKey: mcpQueryKeys.connections(),
      getId: (variables) => variables.connectionId,
      getToggleData: (variables) => ({ enabled: variables.enabled }),
      errorMessage: "Failed to toggle MCP connection",
      retryable: true,
    }),
  )

  // Optimistic mutation for deleting MCP connection
  const deleteConnectionMutation = useOptimisticMutation(
    createOptimisticConfig.forDelete<OptimisticMCPService, string, void>({
      mutationFn: deleteMCPConnection,
      queryKey: mcpQueryKeys.connections(),
      getId: (connectionId) => connectionId,
      onSuccess: () => {
        toast.success(t("integration.mcp.service.deleted"))
      },
      errorMessage: "Failed to delete MCP connection",
      retryable: false,
    }),
  )

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
        <MCPPresetSelectionModal
          onPresetSelected={(preset) => {
            if (!preset.quickSetup) {
              // Show form with preset values pre-filled
              present({
                title: `Setup ${preset.displayName}`,
                content: ({ dismiss: dismissForm }) => (
                  <MCPServiceModalContent
                    service={null}
                    initialValues={preset.configTemplate}
                    onSave={(service) => {
                      createConnectionMutation.mutate(service)
                      dismissForm()
                    }}
                    onCancel={dismissForm}
                  />
                ),
              })
            } else {
              // Direct submission for services
              createConnectionMutation.mutate(preset.configTemplate)
            }
            dismiss()
          }}
          onManualConfig={() => {
            // Show manual configuration form
            present({
              title: "Add MCP Service",
              content: ({ dismiss: dismissForm }) => (
                <MCPServiceModalContent
                  service={null}
                  onSave={(service) => {
                    createConnectionMutation.mutate(service)
                    dismissForm()
                  }}
                  onCancel={dismissForm}
                />
              ),
            })
            dismiss()
          }}
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
        />
      ),
    })
  }

  const { ask } = useDialog()

  const handleDeleteService = async (id: string) => {
    const confirmed = await ask({
      title: t("integration.mcp.service.delete_title"),
      message: t("integration.mcp.service.delete_message"),
      confirmText: t("words.delete", { ns: "common" }),
      cancelText: t("words.cancel", { ns: "common" }),
      variant: "danger",
    })

    if (confirmed) {
      deleteConnectionMutation.mutate(id)
    }
  }

  const handleRefreshTools = (connectionId?: string) => {
    refreshToolsMutation.mutate(connectionId ? [connectionId] : undefined)
  }

  const handleToggleEnabled = (id: string, enabled: boolean) => {
    toggleConnectionMutation.mutate({ connectionId: id, enabled })
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
            <Label className="text-sm font-medium text-text">{t("integration.mcp.enabled")}</Label>
            <div className="text-xs text-text-secondary">{t("integration.mcp.description")}</div>
          </div>
          <Switch checked={mcpEnabled} onCheckedChange={setMCPEnabled} />
        </div>
      </div>

      {mcpEnabled && (
        <>
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-text">
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

          {mcpServices.length === 0 && !isLoading && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-fill-secondary">
                <i className="i-mgc-plugin-2-cute-re size-6 text-text" />
              </div>
              <h4 className="mb-1 text-sm font-medium text-text">
                {t("integration.mcp.services.empty.title")}
              </h4>
              <p className="text-xs text-text-secondary">
                {t("integration.mcp.services.empty.description")}
              </p>
            </div>
          )}

          <div className="!mt-2 space-y-4">
            {mcpServices.map((service) => (
              <MCPServiceItem
                key={service.id}
                service={service}
                onDelete={handleDeleteService}
                onRefresh={handleRefreshTools}
                onEdit={handleEditService}
                onToggleEnabled={handleToggleEnabled}
                isDeleting={
                  deleteConnectionMutation.isPending &&
                  deleteConnectionMutation.variables === service.id
                }
                isRefreshing={
                  refreshToolsMutation.isPending &&
                  refreshToolsMutation.variables?.[0] === service.id
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
