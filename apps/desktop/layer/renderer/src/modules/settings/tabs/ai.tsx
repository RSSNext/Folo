import { Button } from "@follow/components/ui/button/index.js"
import { Input, TextArea } from "@follow/components/ui/input/index.js"
import { KbdCombined } from "@follow/components/ui/kbd/Kbd.js"
import { Label } from "@follow/components/ui/label/index.jsx"
import { Switch } from "@follow/components/ui/switch/index.jsx"
import type { AIShortcut, MCPService } from "@follow/shared/settings/interface"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import {
  addMCPService,
  AIChatPanelStyle,
  connectMCPService,
  discoverMCPService,
  removeMCPService,
  setAIChatPanelStyle,
  setAISetting,
  setMCPEnabled,
  toggleMCPService,
  updateMCPService,
  useAIChatPanelStyle,
  useAISettingValue,
  useMCPEnabled,
  useMCPServices,
} from "~/atoms/settings/ai"

import { SettingActionItem, SettingDescription, SettingTabbedSegment } from "../control"
import { createDefineSettingItem } from "../helper/builder"
import { createSettingBuilder } from "../helper/setting-builder"

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

      <div className="flex h-9 justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges || isOverLimit}
          buttonClassName={`transition-opacity duration-200 ${
            hasChanges && !isOverLimit ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  )
}

const AIShortcutsSection = () => {
  const { t } = useTranslation("ai")
  const { shortcuts } = useAISettingValue()
  const [isCreating, setIsCreating] = useState(false)

  const handleAddShortcut = () => {
    setIsCreating(true)
  }

  const handleSaveShortcut = (shortcut: Omit<AIShortcut, "id">) => {
    const newShortcut: AIShortcut = {
      ...shortcut,
      id: Date.now().toString(),
    }
    setAISetting("shortcuts", [...shortcuts, newShortcut])
    setIsCreating(false)
    toast.success(t("shortcuts.added"))
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

  const handleUpdateShortcut = (id: string, updatedShortcut: Omit<AIShortcut, "id">) => {
    setAISetting(
      "shortcuts",
      shortcuts.map((s) => (s.id === id ? { ...updatedShortcut, id } : s)),
    )
    toast.success(t("shortcuts.updated"))
  }

  return (
    <div className="space-y-4">
      <SettingActionItem
        label={t("shortcuts.add")}
        action={handleAddShortcut}
        buttonText={t("shortcuts.add")}
      />

      {isCreating && (
        <ShortcutEditor onSave={handleSaveShortcut} onCancel={() => setIsCreating(false)} />
      )}

      {shortcuts.length === 0 && !isCreating && (
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
          onUpdate={handleUpdateShortcut}
        />
      ))}
    </div>
  )
}

interface ShortcutItemProps {
  shortcut: AIShortcut
  onDelete: (id: string) => void
  onToggle: (id: string, enabled: boolean) => void
  onUpdate: (id: string, shortcut: Omit<AIShortcut, "id">) => void
}

const ShortcutItem = ({ shortcut, onDelete, onToggle, onUpdate }: ShortcutItemProps) => {
  const [isEditing, setIsEditing] = useState(false)

  const handleSave = (updatedShortcut: Omit<AIShortcut, "id">) => {
    onUpdate(shortcut.id, updatedShortcut)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="before:bg-accent relative pl-4 before:absolute before:inset-y-0 before:left-0 before:w-1 before:rounded-full before:content-['']">
        <ShortcutEditor
          shortcut={shortcut}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    )
  }

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
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
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

interface ShortcutEditorProps {
  shortcut?: AIShortcut
  onSave: (shortcut: Omit<AIShortcut, "id">) => void
  onCancel: () => void
}

const ShortcutEditor = ({ shortcut, onSave, onCancel }: ShortcutEditorProps) => {
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
    <div className="bg-material-medium space-y-4 rounded-lg p-4">
      <div className="grid grid-cols-6 gap-4">
        <div className="col-span-4 space-y-2">
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
  const mcpServices = useMCPServices()

  const [isCreating, setIsCreating] = useState(false)

  const handleAddService = () => {
    setIsCreating(true)
  }

  const handleSaveService = async (
    service: Omit<MCPService, "id" | "isActive" | "healthStatus">,
  ) => {
    try {
      addMCPService({
        ...service,
        isActive: false,
        healthStatus: undefined,
      })
      setIsCreating(false)
      toast.success(t("integration.mcp.service.added"))
    } catch {
      toast.error(t("integration.mcp.service.discovery_failed"))
    }
  }

  const handleDeleteService = (id: string) => {
    removeMCPService(id)
    toast.success(t("integration.mcp.service.deleted"))
  }

  const handleToggleService = (id: string, isActive: boolean) => {
    toggleMCPService(id, isActive)
  }

  const handleUpdateService = (id: string, updatedService: Omit<MCPService, "id">) => {
    updateMCPService(id, updatedService)
    toast.success(t("integration.mcp.service.updated"))
  }

  const handleConnectService = async (id: string) => {
    const success = await connectMCPService(id)
    if (success) {
      toast.success(t("integration.mcp.service.connected_success"))
    } else {
      toast.error(t("integration.mcp.service.connection_failed"))
    }
  }

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
            <Button variant="outline" size="sm" onClick={handleAddService}>
              <i className="i-mgc-add-cute-re mr-2 size-4" />
              {t("integration.mcp.services.add")}
            </Button>
          </div>

          {isCreating && (
            <MCPServiceEditor onSave={handleSaveService} onCancel={() => setIsCreating(false)} />
          )}

          {mcpServices.length === 0 && !isCreating && (
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

          {mcpServices.map((service) => (
            <MCPServiceItem
              key={service.id}
              service={service}
              onDelete={handleDeleteService}
              onToggle={handleToggleService}
              onUpdate={handleUpdateService}
              onConnect={handleConnectService}
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
  onToggle: (id: string, isActive: boolean) => void
  onUpdate: (id: string, service: Omit<MCPService, "id">) => void
  onConnect: (id: string) => void
}

const MCPServiceItem = ({
  service,
  onDelete,
  onToggle,
  onUpdate,
  onConnect,
}: MCPServiceItemProps) => {
  const { t } = useTranslation("ai")
  const [isEditing, setIsEditing] = useState(false)

  const handleSave = (updatedService: Omit<MCPService, "id" | "isActive" | "healthStatus">) => {
    onUpdate(service.id, {
      ...updatedService,
      isActive: service.isActive,
      healthStatus: service.healthStatus,
    })
    setIsEditing(false)
  }

  const getConnectionStatusColor = (status?: string) => {
    switch (status) {
      case "connected": {
        return "bg-green/10 text-green"
      }
      case "connecting": {
        return "bg-blue/10 text-blue"
      }
      case "error": {
        return "bg-red/10 text-red"
      }
      default: {
        return "bg-gray/10 text-text-tertiary"
      }
    }
  }

  const getHealthStatusColor = (status?: string) => {
    switch (status) {
      case "healthy": {
        return "bg-green/10 text-green"
      }
      case "degraded": {
        return "bg-yellow/10 text-yellow"
      }
      case "unhealthy": {
        return "bg-red/10 text-red"
      }
      default: {
        return "bg-gray/10 text-text-tertiary"
      }
    }
  }

  const getConnectionStatusText = (status?: string) => {
    switch (status) {
      case "connected": {
        return t("integration.mcp.service.connected")
      }
      case "connecting": {
        return t("integration.mcp.service.connecting")
      }
      case "error": {
        return t("integration.mcp.service.error")
      }
      default: {
        return t("integration.mcp.service.disconnected")
      }
    }
  }

  if (isEditing) {
    return (
      <div className="before:bg-accent relative pl-4 before:absolute before:inset-y-0 before:left-0 before:w-1 before:rounded-full before:content-['']">
        <MCPServiceEditor
          service={service}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    )
  }

  return (
    <div className="hover:bg-material-medium border-border group rounded-lg border p-4 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="text-text text-sm font-medium">{service.name}</h4>
            <div
              className={`rounded-full px-2 py-1 text-xs ${getConnectionStatusColor(service.connectionStatus)}`}
            >
              {getConnectionStatusText(service.connectionStatus)}
            </div>
            {service.healthStatus && (
              <div
                className={`rounded-full px-2 py-1 text-xs ${getHealthStatusColor(service.healthStatus)}`}
              >
                {t(`integration.mcp.service.${service.healthStatus}`)}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-text-secondary text-xs">
              <span className="text-text-tertiary">Base URL:</span> {service.baseUrl}
            </p>
            <p className="text-text-secondary text-xs">
              <span className="text-text-tertiary">MCP Endpoint:</span> {service.mcpEndpoint}
            </p>
            {service.requiredScopes && (
              <p className="text-text-secondary text-xs">
                <span className="text-text-tertiary">{t("integration.mcp.service.scopes")}:</span>{" "}
                {service.requiredScopes}
              </p>
            )}
            {service.lastError && (
              <p className="text-red text-xs">
                <span className="text-text-tertiary">Error:</span> {service.lastError}
              </p>
            )}
          </div>
        </div>

        <div className="ml-4 flex items-center gap-3">
          <div className="flex items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
            {service.connectionStatus === "disconnected" && (
              <Button variant="ghost" size="sm" onClick={() => onConnect(service.id)}>
                <i className="i-mgc-link-cute-re size-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              <i className="i-mgc-edit-cute-re size-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(service.id)}>
              <i className="i-mgc-delete-2-cute-re size-4" />
            </Button>
          </div>

          <div className="border-fill-tertiary flex items-center gap-2 border-l pl-3">
            <span className="text-text-tertiary text-xs font-medium">
              {service.isActive ? "ON" : "OFF"}
            </span>
            <Switch
              checked={service.isActive}
              onCheckedChange={(isActive) => onToggle(service.id, isActive)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

interface MCPServiceEditorProps {
  service?: MCPService
  onSave: (service: Omit<MCPService, "id" | "isActive" | "healthStatus">) => void
  onCancel: () => void
}

const MCPServiceEditor = ({ service, onSave, onCancel }: MCPServiceEditorProps) => {
  const { t } = useTranslation("ai")
  const [name, setName] = useState(service?.name || "")
  const [baseUrl, setBaseUrl] = useState(service?.baseUrl || "")
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [discoveredService, setDiscoveredService] = useState<Omit<
    MCPService,
    "id" | "isActive" | "healthStatus"
  > | null>(
    service
      ? {
          name: service.name,
          baseUrl: service.baseUrl,
          mcpEndpoint: service.mcpEndpoint,
          authorizationEndpoint: service.authorizationEndpoint,
          tokenEndpoint: service.tokenEndpoint,
          clientId: service.clientId,
          requiredScopes: service.requiredScopes,
        }
      : null,
  )

  const handleDiscover = async () => {
    if (!baseUrl.trim()) {
      toast.error(t("integration.mcp.service.validation.baseUrl_required"))
      return
    }

    // Basic URL validation
    try {
      new URL(baseUrl)
    } catch {
      toast.error(t("integration.mcp.service.validation.invalid_url"))
      return
    }

    setIsDiscovering(true)
    try {
      const discovered = await discoverMCPService(baseUrl.trim())
      setDiscoveredService(discovered)
      if (!name.trim()) {
        setName(discovered.name)
      }
      toast.success("Service endpoints discovered successfully")
    } catch {
      toast.error(t("integration.mcp.service.discovery_failed"))
    } finally {
      setIsDiscovering(false)
    }
  }

  const handleSave = () => {
    if (!name.trim()) {
      toast.error(t("integration.mcp.service.validation.name_required"))
      return
    }

    if (!discoveredService) {
      toast.error("Please discover service endpoints first")
      return
    }

    onSave({
      ...discoveredService,
      name: name.trim(),
    })
  }

  return (
    <div className="bg-material-medium space-y-4 rounded-lg p-4">
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
            <Label className="text-text text-xs">{t("integration.mcp.service.baseUrl")}</Label>
            <div className="flex gap-2">
              <Input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={t("integration.mcp.service.baseUrl_placeholder")}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleDiscover}
                disabled={isDiscovering || !baseUrl.trim()}
              >
                {isDiscovering ? (
                  <i className="i-mgc-loading-3-cute-re mr-2 size-4 animate-spin" />
                ) : (
                  <i className="i-mgc-search-cute-re mr-2 size-4" />
                )}
                <span>{t("integration.mcp.service.discover")}</span>
              </Button>
            </div>
          </div>
        </div>

        {discoveredService && (
          <div className="border-border space-y-3 rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <i className="i-mgc-check-cute-re text-green size-4" />
              <span className="text-text text-sm font-medium">
                {t("integration.mcp.service.endpoints")}
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-text-tertiary">MCP Endpoint:</span>
                <span className="text-text-secondary ml-2">{discoveredService.mcpEndpoint}</span>
              </div>
              <div>
                <span className="text-text-tertiary">Authorization:</span>
                <span className="text-text-secondary ml-2">
                  {discoveredService.authorizationEndpoint}
                </span>
              </div>
              <div>
                <span className="text-text-tertiary">Token:</span>
                <span className="text-text-secondary ml-2">{discoveredService.tokenEndpoint}</span>
              </div>
              <div>
                <span className="text-text-tertiary">Client ID:</span>
                <span className="text-text-secondary ml-2">{discoveredService.clientId}</span>
              </div>
              {discoveredService.requiredScopes && (
                <div>
                  <span className="text-text-tertiary">{t("integration.mcp.service.scopes")}:</span>
                  <span className="text-text-secondary ml-2">
                    {discoveredService.requiredScopes}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!discoveredService}>
            Save
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
