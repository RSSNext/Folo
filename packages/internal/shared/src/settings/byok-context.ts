import type { UserByokProviderConfig, UserByokSettings } from "./interface"

type ByokResolver = () => UserByokSettings | null
type ByokCompletionFn = (
  config: UserByokProviderConfig,
  options: {
    messages: { role: "system" | "user" | "assistant"; content: string }[]
    model?: string
    signal?: AbortSignal
  },
) => Promise<{ content: string }>

let byokResolver: ByokResolver | null = null
let byokCompletionFn: ByokCompletionFn | null = null

export function setByokResolver(resolver: ByokResolver) {
  byokResolver = resolver
}

export function setByokCompletionFn(fn: ByokCompletionFn) {
  byokCompletionFn = fn
}

export function getByokSettings(): UserByokSettings | null {
  return byokResolver?.() ?? null
}

export function getActiveByokConfig(): UserByokProviderConfig | null {
  const settings = byokResolver?.()
  if (!settings?.enabled || settings.providers.length === 0) return null
  // Use the first configured provider as the active one
  return settings.providers[0] ?? null
}

export function isByokLocalProvider(provider: string): boolean {
  return ["ollama", "lmstudio", "openai-compatible", "mlx-vlm"].includes(provider)
}

export function getActiveLocalByokConfig(): UserByokProviderConfig | null {
  const config = getActiveByokConfig()
  if (!config) return null
  return isByokLocalProvider(config.provider) ? config : null
}

export async function executeByokCompletion(
  config: UserByokProviderConfig,
  options: {
    messages: { role: "system" | "user" | "assistant"; content: string }[]
    model?: string
    signal?: AbortSignal
  },
): Promise<{ content: string }> {
  if (!byokCompletionFn) {
    throw new Error("BYOK completion function not initialized")
  }
  return byokCompletionFn(config, options)
}
