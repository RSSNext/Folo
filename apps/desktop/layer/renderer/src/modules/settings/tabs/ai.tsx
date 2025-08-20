import { Spring } from "@follow/components/constants/spring.js"
import { Button } from "@follow/components/ui/button/index.js"
import { Input, TextArea } from "@follow/components/ui/input/index.js"
import { KbdCombined } from "@follow/components/ui/kbd/Kbd.js"
import { KeyValueEditor } from "@follow/components/ui/key-value-editor/index.js"
import { Label } from "@follow/components/ui/label/index.jsx"
import { Progress } from "@follow/components/ui/progress/index.jsx"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@follow/components/ui/select/index.js"
import { Switch } from "@follow/components/ui/switch/index.jsx"
import type { AIShortcut, MCPService } from "@follow/shared/settings/interface"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AnimatePresence } from "motion/react"
import * as React from "react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import {
  AIChatPanelStyle,
  setAIChatPanelStyle,
  setAISetting,
  setMCPEnabled,
  useAIChatPanelStyle,
  useAISettingValue,
  useMCPEnabled,
} from "~/atoms/settings/ai"
import { m } from "~/components/common/Motion"
import { useDialog, useModalStack } from "~/components/ui/modal/stacked/hooks"
import { apiFetch } from "~/lib/api-fetch"
import {
  createMCPConnection,
  deleteMCPConnection,
  fetchMCPConnections,
  mcpQueryKeys,
  refreshMCPTools,
  updateMCPConnection,
} from "~/queries/mcp"

import { SettingActionItem, SettingDescription, SettingTabbedSegment } from "../control"
import { createDefineSettingItem } from "../helper/builder"
import { createSettingBuilder } from "../helper/setting-builder"
import { SettingModalContentPortal } from "../modal/layout"

const SettingBuilder = createSettingBuilder(useAISettingValue)
const defineSettingItem = createDefineSettingItem(useAISettingValue, setAISetting)

export const SettingAI = () => {
  const { t } = useTranslation("ai")

  return (
    <div className="mt-4">
      <SettingBuilder
        settings={[
          {
            type: "title",
            value: t("token_usage.title"),
          },
          TokenUsageSection,
          {
            type: "title",
            value: t("features.title"),
          },

          PanelStyleSegment,
          defineSettingItem("autoScrollWhenStreaming", {
            label: t("settings.autoScrollWhenStreaming.label"),
            description: t("settings.autoScrollWhenStreaming.description"),
          }),

          {
            type: "title",
            value: t("personalize.title"),
          },

          PersonalizePromptSetting,

          {
            type: "title",
            value: t("shortcuts.title"),
          },
          AIShortcutsSection,

          {
            type: "title",
            value: t("integration.title"),
          },
          MCPServicesSection,
        ]}
      />
    </div>
  )
}

const useTokenUsage = () => {
  return useQuery({
    queryKey: ["aiTokenUsage"],
    queryFn: async () => {
      // TODO: replace with api client call
      return (
        (await apiFetch("/ai/usage")) as {
          code: 0
          data: {
            total: number
            used: number
            remaining: number
            resetAt: string
          }
        }
      ).data
    },
  })
}

const TokenUsageSection = () => {
  const { t } = useTranslation("ai")

  const tokenUsage = useTokenUsage().data || {
    total: 0,
    used: 0,
    remaining: 0,
    resetAt: new Date(),
  }

  const usagePercentage = tokenUsage.total === 0 ? 0 : (tokenUsage.used / tokenUsage.total) * 100
  const resetDate = new Date(tokenUsage.resetAt)

  return (
    <div className="space-y-4">
      <SettingDescription>{t("token_usage.description")}</SettingDescription>

      <div className="bg-material-medium border-border space-y-4 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-text text-sm font-medium">
              {t("token_usage.tokens_used", {
                used: tokenUsage.used.toLocaleString(),
                total: tokenUsage.total.toLocaleString(),
              })}
            </p>
            <p className="text-text-secondary text-xs">
              {tokenUsage.remaining.toLocaleString()} {t("token_usage.tokens_remaining")}
            </p>
          </div>

          <div className="text-right">
            <div className="text-text text-sm font-medium">{Math.round(usagePercentage)}%</div>
          </div>
        </div>

        <div className="space-y-2">
          <Progress value={usagePercentage} className="h-2" />

          <div className="text-text-tertiary flex items-center justify-between text-xs">
            <span>0</span>
            <span>
              {t("token_usage.resets_at")}: {resetDate.toLocaleDateString()}
            </span>
            <span>{tokenUsage.total.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <div className="bg-accent size-3 rounded-full" />
          <span className="text-text-secondary text-xs">Current usage</span>
        </div>
      </div>
    </div>
  )
}

const PersonalizePromptSetting = () => {
  const { t } = useTranslation("ai")
  const aiSettings = useAISettingValue()
  const [prompt, setPrompt] = useState(aiSettings.personalizePrompt)
  const [isSaving, setIsSaving] = useState(false)

  const MAX_CHARACTERS = 500
  const currentLength = prompt.length
  const isOverLimit = currentLength > MAX_CHARACTERS
  const hasChanges = prompt !== aiSettings.personalizePrompt

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target
    // Allow typing but show validation error if over limit
    setPrompt(value)
  }

  const handleSave = async () => {
    if (isOverLimit) {
      toast.error(`Prompt must be ${MAX_CHARACTERS} characters or less`)
      return
    }

    setIsSaving(true)
    try {
      setAISetting("personalizePrompt", prompt)
      toast.success(t("personalize.saved"))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-text text-sm font-medium">{t("personalize.prompt.label")}</Label>
        <div className="relative -mx-3">
          <TextArea
            value={prompt}
            onChange={handlePromptChange}
            placeholder={t("personalize.prompt.placeholder")}
            className={`min-h-[80px] resize-none text-sm ${
              isOverLimit ? "border-red focus:border-red" : ""
            }`}
          />
          <div
            className={`absolute bottom-2 right-2 text-xs ${
              isOverLimit
                ? "text-red"
                : currentLength > MAX_CHARACTERS * 0.8
                  ? "text-yellow"
                  : "text-text-tertiary"
            }`}
          >
            {currentLength}/{MAX_CHARACTERS}
          </div>
        </div>
        <SettingDescription>
          {t("personalize.prompt.help")}
          {isOverLimit && (
            <span className="text-red mt-1 block">
              Prompt exceeds {MAX_CHARACTERS} character limit
            </span>
          )}
        </SettingDescription>
      </div>

      <AnimatePresence>
        {hasChanges && (
          <SettingModalContentPortal>
            <m.div
              initial={{ y: 20, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.95 }}
              transition={Spring.presets.snappy}
              className="absolute inset-x-0 bottom-3 z-10 flex justify-center px-3"
            >
              <div className="backdrop-blur-background bg-material-medium border-border shadow-perfect flex w-fit max-w-[92%] items-center justify-between gap-3 rounded-full border py-2 pl-5 pr-2">
                <span className="text-text-secondary text-xs sm:text-sm">Unsaved changes</span>
                <Button
                  buttonClassName="bg-accent rounded-full"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || isOverLimit}
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </m.div>
          </SettingModalContentPortal>
        )}
      </AnimatePresence>
    </div>
  )
}

const AIShortcutsSection = () => {
  const { t } = useTranslation("ai")
  const { shortcuts } = useAISettingValue()
  const { present } = useModalStack()

  const handleAddShortcut = () => {
    present({
      title: "Add AI Shortcut",
      content: ({ dismiss }: { dismiss: () => void }) => (
        <ShortcutModalContent
          shortcut={null}
          onSave={(shortcut) => {
            const newShortcut: AIShortcut = {
              ...shortcut,
              id: Date.now().toString(),
            }
            setAISetting("shortcuts", [...shortcuts, newShortcut])
            toast.success(t("shortcuts.added"))
            dismiss()
          }}
          onCancel={dismiss}
        />
      ),
    })
  }

  const handleEditShortcut = (shortcut: AIShortcut) => {
    present({
      title: "Edit AI Shortcut",
      content: ({ dismiss }: { dismiss: () => void }) => (
        <ShortcutModalContent
          shortcut={shortcut}
          onSave={(updatedShortcut) => {
            setAISetting(
              "shortcuts",
              shortcuts.map((s) =>
                s.id === shortcut.id ? { ...updatedShortcut, id: shortcut.id } : s,
              ),
            )
            toast.success(t("shortcuts.updated"))
            dismiss()
          }}
          onCancel={dismiss}
        />
      ),
    })
  }

  const handleDeleteShortcut = (id: string) => {
    setAISetting(
      "shortcuts",
      shortcuts.filter((s) => s.id !== id),
    )
    toast.success(t("shortcuts.deleted"))
  }

  const handleToggleShortcut = (id: string, enabled: boolean) => {
    setAISetting(
      "shortcuts",
      shortcuts.map((s) => (s.id === id ? { ...s, enabled } : s)),
    )
  }

  return (
    <div className="space-y-4">
      <SettingActionItem
        label={t("shortcuts.add")}
        action={handleAddShortcut}
        buttonText={t("shortcuts.add")}
      />

      {shortcuts.length === 0 && (
        <div className="py-8 text-center">
          <div className="bg-fill-secondary mx-auto mb-3 flex size-12 items-center justify-center rounded-full">
            <i className="i-mgc-magic-2-cute-re text-text size-6" />
          </div>
          <h4 className="text-text mb-1 text-sm font-medium">{t("shortcuts.empty.title")}</h4>
          <p className="text-text-secondary text-xs">{t("shortcuts.empty.description")}</p>
        </div>
      )}

      {shortcuts.map((shortcut) => (
        <ShortcutItem
          key={shortcut.id}
          shortcut={shortcut}
          onDelete={handleDeleteShortcut}
          onToggle={handleToggleShortcut}
          onEdit={handleEditShortcut}
        />
      ))}
    </div>
  )
}

interface ShortcutItemProps {
  shortcut: AIShortcut
  onDelete: (id: string) => void
  onToggle: (id: string, enabled: boolean) => void
  onEdit: (shortcut: AIShortcut) => void
}

const ShortcutItem = ({ shortcut, onDelete, onToggle, onEdit }: ShortcutItemProps) => {
  return (
    <div className="hover:bg-material-medium border-border group rounded-lg border p-4 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="text-text text-sm font-medium">{shortcut.name}</h4>
            {shortcut.hotkey && (
              <KbdCombined kbdProps={{ wrapButton: false }} joint={false}>
                {shortcut.hotkey}
              </KbdCombined>
            )}
          </div>
          <p className="text-text-secondary line-clamp-2 text-xs leading-relaxed">
            {shortcut.prompt}
          </p>
        </div>

        <div className="ml-4 flex items-center gap-3">
          <div className="flex items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
            <Button variant="ghost" size="sm" onClick={() => onEdit(shortcut)}>
              <i className="i-mgc-edit-cute-re size-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(shortcut.id)}>
              <i className="i-mgc-delete-2-cute-re size-4" />
            </Button>
          </div>

          <div className="border-fill-tertiary flex items-center gap-2 border-l pl-3">
            <span className="text-text-tertiary text-xs font-medium">
              {shortcut.enabled ? "ON" : "OFF"}
            </span>
            <Switch
              checked={shortcut.enabled}
              onCheckedChange={(enabled) => onToggle(shortcut.id, enabled)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

interface ShortcutModalContentProps {
  shortcut?: AIShortcut | null
  onSave: (shortcut: Omit<AIShortcut, "id">) => void
  onCancel: () => void
}

const ShortcutModalContent = ({ shortcut, onSave, onCancel }: ShortcutModalContentProps) => {
  const { t } = useTranslation("ai")
  const [name, setName] = useState(shortcut?.name || "")
  const [prompt, setPrompt] = useState(shortcut?.prompt || "")

  const [enabled, setEnabled] = useState(shortcut?.enabled ?? true)

  const handleSave = () => {
    if (!name.trim() || !prompt.trim()) {
      toast.error(t("shortcuts.validation.required"))
      return
    }

    onSave({
      name: name.trim(),
      prompt: prompt.trim(),
      enabled,
    })
  }

  return (
    <div className="w-[400px] space-y-4">
      <div className="grid grid-cols-6 gap-4">
        <div className="col-span-6 space-y-2">
          <Label className="text-text text-xs">{t("shortcuts.name")}</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("shortcuts.name_placeholder")}
          />
        </div>
        {/* <div className="col-span-2 space-y-2">
          <Label className="text-text text-xs">{t("shortcuts.hotkey")}</Label>
          <button
            type="button"
            className="border-border hover:bg-material-medium flex h-9 w-full items-center rounded-md border bg-transparent px-3 py-2 text-sm transition-colors focus:outline-none"
            onClick={() => setIsRecording(!isRecording)}
          >
            {isRecording ? (
              <KeyRecorder
                onBlur={() => setIsRecording(false)}
                onChange={(keys) => {
                  setHotkey(Array.isArray(keys) ? keys.join("+") : "")
                  setIsRecording(false)
                }}
              />
            ) : (
              <div className="flex w-full items-center justify-center">
                <div className="flex items-center justify-center gap-2">
                  {hotkey ? (
                    <KbdCombined kbdProps={{ wrapButton: false }} joint={false}>
                      {hotkey}
                    </KbdCombined>
                  ) : (
                    <span className="text-text-tertiary text-xs">Click to record</span>
                  )}
                </div>
              </div>
            )}
          </button>
        </div> */}
      </div>

      <div className="space-y-2">
        <Label className="text-text text-xs">{t("shortcuts.prompt")}</Label>
        <TextArea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t("shortcuts.prompt_placeholder")}
          className="min-h-[60px] resize-none text-sm"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch checked={enabled} onCheckedChange={setEnabled} />
          <Label className="text-text text-xs">{t("shortcuts.enabled")}</Label>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

const MCPServicesSection = () => {
  const { t } = useTranslation("ai")
  const mcpEnabled = useMCPEnabled()
  const queryClient = useQueryClient()
  const dialog = useDialog()

  // Reusable OAuth authorization handler using dialog
  const handleOAuthAuthorization = async (authorizationUrl: string) => {
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
        toast.success(t("integration.mcp.service.auth_window_opened"))
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
        await handleOAuthAuthorization(result.authorizationUrl)
      } else {
        toast.success(t("integration.mcp.service.added"))
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
        await handleOAuthAuthorization(result.authorizationUrl)
      } else {
        toast.success(t("integration.mcp.service.updated"))
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

interface MCPServiceItemProps {
  service: MCPService
  onDelete: (id: string) => void
  onRefresh: (connectionId: string) => void
  onEdit: (service: MCPService) => void
  isDeleting?: boolean
  isRefreshing?: boolean
}

const MCPServiceItem = ({
  service,
  onDelete,
  onRefresh,
  onEdit,
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

  return (
    <div className="hover:bg-material-medium border-border group rounded-lg border p-4 transition-colors">
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

        <div className="ml-4 flex items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
          <Button variant="ghost" size="sm" onClick={() => onEdit(service)} title="Edit connection">
            <i className="i-mgc-edit-cute-re size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRefresh(service.id)}
            title="Refresh tools"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <i className="i-mgc-loading-3-cute-re size-4 animate-spin" />
            ) : (
              <i className="i-mgc-refresh-2-cute-re size-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(service.id)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <i className="i-mgc-loading-3-cute-re size-4 animate-spin" />
            ) : (
              <i className="i-mgc-delete-2-cute-re size-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

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

const MCPServiceModalContent = ({
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

export const PanelStyleSegment = () => {
  const { t } = useTranslation("ai")
  const panelStyle = useAIChatPanelStyle()

  return (
    <SettingTabbedSegment
      key="panel-style"
      label={t("settings.panel_style.label")}
      description={t("settings.panel_style.description")}
      value={panelStyle}
      values={[
        {
          value: AIChatPanelStyle.Fixed,
          label: t("settings.panel_style.fixed"),
          icon: <i className="i-mingcute-rectangle-vertical-line" />,
        },
        {
          value: AIChatPanelStyle.Floating,
          label: t("settings.panel_style.floating"),
          icon: <i className="i-mingcute-layout-right-line" />,
        },
      ]}
      onValueChanged={(value) => {
        setAIChatPanelStyle(value as AIChatPanelStyle)
      }}
    />
  )
}
