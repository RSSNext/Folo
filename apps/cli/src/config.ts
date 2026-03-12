import { mkdir, readFile, writeFile } from "node:fs/promises"
import { homedir } from "node:os"

import { join } from "pathe"

export interface FoloCLIConfig {
  token?: string
  apiUrl?: string
}

const configDir = join(homedir(), ".folo")
const configPath = join(configDir, "config.json")

const normalizeConfig = (config: unknown): FoloCLIConfig => {
  if (!config || typeof config !== "object") {
    return {}
  }

  const source = config as Record<string, unknown>
  return {
    token: typeof source.token === "string" ? source.token : undefined,
    apiUrl: typeof source.apiUrl === "string" ? source.apiUrl : undefined,
  }
}

export const getConfigPath = () => configPath

export const readConfig = async (): Promise<FoloCLIConfig> => {
  try {
    const raw = await readFile(configPath, "utf8")
    return normalizeConfig(JSON.parse(raw))
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException
    if (nodeError.code === "ENOENT") {
      return {}
    }

    throw error
  }
}

const ensureConfigDir = async () => {
  await mkdir(configDir, { recursive: true })
}

export const writeConfig = async (config: FoloCLIConfig) => {
  await ensureConfigDir()
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8")
}

export const updateConfig = async (patch: Partial<FoloCLIConfig>) => {
  const current = await readConfig()
  const next: FoloCLIConfig = {
    ...current,
    ...patch,
  }

  if (!next.token) {
    delete next.token
  }
  if (!next.apiUrl) {
    delete next.apiUrl
  }

  await writeConfig(next)
  return next
}

export const clearToken = async () => {
  const current = await readConfig()
  if (!current.token) {
    return
  }

  delete current.token
  await writeConfig(current)
}
