import { listCustomAIModels, testCustomAIConfig } from "@follow/store/custom-ai/client"
import type { CustomAIConfig } from "@follow/store/custom-ai/store"
import { DEFAULT_CUSTOM_AI_BASE_URL, getCustomAIConfig } from "@follow/store/custom-ai/store"
import { useMemo, useState } from "react"

import {
  NavigationBlurEffectHeaderView,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import { TextField } from "@/src/components/ui/form/TextField"
import {
  GroupedInsetButtonCell,
  GroupedInsetListBaseCell,
  GroupedInsetListCard,
  GroupedInsetListCell,
  GroupedInsetListSectionHeader,
  GroupedOutlineDescription,
} from "@/src/components/ui/grouped/GroupedList"
import { Switch } from "@/src/components/ui/switch/Switch"
import { saveCustomAIConfig } from "@/src/lib/custom-ai"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { toast } from "@/src/lib/toast"

const PRESETS = [
  { label: "OpenAI", baseURL: "https://api.openai.com/v1" },
  { label: "DeepSeek", baseURL: "https://api.deepseek.com/v1" },
  { label: "OpenRouter", baseURL: "https://openrouter.ai/api/v1" },
  { label: "硅基流动 SiliconFlow", baseURL: "https://api.siliconflow.cn/v1" },
]

const MAX_LISTED_MODELS = 30

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error))

type Status = { message: string; isError: boolean }

export const CustomAIScreen: NavigationControllerView = () => {
  const [draft, setDraft] = useState<CustomAIConfig>(() => ({ ...getCustomAIConfig() }))
  const [models, setModels] = useState<string[]>([])
  const [busy, setBusy] = useState<"models" | "test" | null>(null)
  const [status, setStatus] = useState<Status | null>(null)

  const update = (patch: Partial<CustomAIConfig>) => setDraft((prev) => ({ ...prev, ...patch }))

  const save = (config: CustomAIConfig) => {
    try {
      saveCustomAIConfig(config)
      return true
    } catch (error) {
      toast.error("保存失败", { description: errorMessage(error) })
      return false
    }
  }

  const filteredModels = useMemo(() => {
    const query = draft.model.trim().toLowerCase()
    return models
      .filter((id) => !query || id.toLowerCase().includes(query))
      .slice(0, MAX_LISTED_MODELS)
  }, [models, draft.model])

  const fetchModels = async () => {
    setBusy("models")
    setStatus(null)
    try {
      const ids = await listCustomAIModels(draft)
      setModels(ids)
      setStatus({ message: `找到 ${ids.length} 个模型，可在下方点选`, isError: false })
    } catch (error) {
      setStatus({ message: `获取模型失败：${errorMessage(error)}`, isError: true })
    } finally {
      setBusy(null)
    }
  }

  const testConnection = async () => {
    if (!draft.model.trim()) {
      setStatus({ message: "请先填写模型", isError: true })
      return
    }
    setBusy("test")
    setStatus(null)
    try {
      const reply = await testCustomAIConfig(draft)
      setStatus({ message: `连接成功，模型回复：${reply.slice(0, 80)}`, isError: false })
    } catch (error) {
      setStatus({ message: `连接失败：${errorMessage(error)}`, isError: true })
    } finally {
      setBusy(null)
    }
  }

  return (
    <SafeNavigationScrollView
      className="bg-system-grouped-background"
      Header={<NavigationBlurEffectHeaderView title="自定义 AI" />}
    >
      <GroupedInsetListSectionHeader label="开关" marginSize="small" />
      <GroupedInsetListCard>
        <GroupedInsetListCell
          label="使用自己的 API"
          description="开启后，AI 摘要和翻译直接请求你填写的 OpenAI 兼容接口，不经过 Folo 服务器，也不需要会员。"
        >
          <Switch
            size="sm"
            value={draft.enabled}
            onValueChange={(enabled) => {
              const next = { ...draft, enabled }
              setDraft(next)
              if (save(next) && enabled && (!next.baseURL.trim() || !next.model.trim())) {
                setStatus({ message: "填好 Base URL 和模型并保存后才会生效", isError: true })
              }
            }}
          />
        </GroupedInsetListCell>
      </GroupedInsetListCard>

      <GroupedInsetListSectionHeader label="接口" />
      <GroupedInsetListCard>
        <GroupedInsetListBaseCell>
          <TextField
            label="Base URL"
            required
            placeholder={DEFAULT_CUSTOM_AI_BASE_URL}
            inputMode="url"
            autoCapitalize="none"
            autoCorrect={false}
            value={draft.baseURL}
            onChangeText={(baseURL) => update({ baseURL })}
          />
        </GroupedInsetListBaseCell>
        <GroupedInsetListBaseCell>
          <TextField
            label="API Key"
            placeholder="sk-..."
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={draft.apiKey}
            onChangeText={(apiKey) => update({ apiKey })}
          />
        </GroupedInsetListBaseCell>
        <GroupedInsetListBaseCell>
          <TextField
            label="模型"
            required
            placeholder="如 gpt-4o-mini、deepseek-chat"
            autoCapitalize="none"
            autoCorrect={false}
            value={draft.model}
            onChangeText={(model) => update({ model })}
          />
        </GroupedInsetListBaseCell>
      </GroupedInsetListCard>

      <GroupedInsetListSectionHeader label="操作" />
      <GroupedInsetListCard>
        <GroupedInsetButtonCell
          label="保存"
          disabled={busy !== null}
          onPress={() => {
            if (save(draft)) toast.success("已保存")
          }}
        />
        <GroupedInsetButtonCell
          label={busy === "test" ? "测试中…" : "测试连接"}
          disabled={busy !== null}
          onPress={testConnection}
        />
        <GroupedInsetButtonCell
          label={busy === "models" ? "获取中…" : "获取模型列表"}
          disabled={busy !== null}
          onPress={fetchModels}
        />
      </GroupedInsetListCard>
      {!!status && (
        <GroupedOutlineDescription description={status.message} isError={status.isError} />
      )}

      {filteredModels.length > 0 && (
        <>
          <GroupedInsetListSectionHeader label="可用模型（输入框可筛选）" />
          <GroupedInsetListCard>
            {filteredModels.map((id) => (
              <GroupedInsetListCell key={id} label={id} onPress={() => update({ model: id })} />
            ))}
          </GroupedInsetListCard>
        </>
      )}

      <GroupedInsetListSectionHeader label="常用地址（点选填入 Base URL）" />
      <GroupedInsetListCard>
        {PRESETS.map((preset) => (
          <GroupedInsetListCell
            key={preset.baseURL}
            label={preset.label}
            description={preset.baseURL}
            onPress={() => update({ baseURL: preset.baseURL })}
          />
        ))}
      </GroupedInsetListCard>
      <GroupedOutlineDescription description="API Key 只保存在这台设备的钥匙串里，不会同步到 Folo 服务器。修改后记得点保存。" />
    </SafeNavigationScrollView>
  )
}
