import { chmod, mkdir, readFile, rename, writeFile } from "node:fs/promises"
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
  let raw: string
  try {
    raw = await readFile(configPath, "utf8")
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException
    if (nodeError.code === "ENOENT") {
      return {}
    }

    throw error
  }

  try {
    return normalizeConfig(JSON.parse(raw))
  } catch {
    // A damaged file would otherwise stop every command, login included, until it is deleted
    console.error(`[config] Ignoring unreadable config at ${configPath}. Run login again.`)
    return {}
  }
}

const ensureConfigDir = async () => {
  await mkdir(configDir, { recursive: true, mode: 0o700 })
  if (process.platform !== "win32") {
    await chmod(configDir, 0o700).catch(() => {})
  }
}

// The token is readable only by the user, and the file is replaced in one step so a concurrent
// or interrupted write never leaves half a file
export const writeConfig = async (config: FoloCLIConfig) => {
  await ensureConfigDir()
  const tempPath = `${configPath}.${process.pid}.tmp`
  await writeFile(tempPath, `${JSON.stringify(config, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  })
  await rename(tempPath, configPath)
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
