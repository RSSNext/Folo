import { fetch as expoFetch } from "expo/fetch"
import { Directory, File, Paths } from "expo-file-system"

import { trackFetch } from "@/src/lib/network-activity"

import { fetchTtsVoices as fetchTtsVoicesCore, requestTtsBytes } from "./tts-core"

export { DEFAULT_TTS_VOICE, getEntryTtsText, TTS_SERVICE_URL, type TtsVoice } from "./tts-core"

interface TtsCacheFile {
  uri: string
  write: (content: Uint8Array) => void
}

interface TtsDependencies {
  createCacheFile: (cacheKey: string) => TtsCacheFile
  fetch: typeof expoFetch
}

interface TtsCacheDirectory {
  exists: boolean
  list: () => { delete: () => void; name: string }[]
}

const sanitizeCacheKey = (value: string) =>
  value
    .trim()
    .replaceAll(/[^\w-]+/g, "_")
    .replaceAll(/^_+|_+$/g, "") || "tts"

const getCacheDirectory = () => new Directory(Paths.cache, "tts")

const createCacheFile = (cacheKey: string): TtsCacheFile => {
  const directory = getCacheDirectory()
  directory.create({
    idempotent: true,
    intermediates: true,
  })

  const file = new File(directory, `${sanitizeCacheKey(cacheKey)}-${Date.now()}.mp3`)
  file.create({
    intermediates: true,
    overwrite: true,
  })

  return {
    uri: file.uri,
    write(content) {
      file.write(content)
    },
  }
}

const defaultDependencies: TtsDependencies = {
  createCacheFile,
  fetch: trackFetch(expoFetch),
}

export const fetchTtsVoices = async (
  signal?: AbortSignal,
  dependencies: Pick<TtsDependencies, "fetch"> = defaultDependencies,
) => fetchTtsVoicesCore({ fetch: dependencies.fetch as typeof globalThis.fetch, signal })

export const requestTtsFile = async ({
  cacheKey,
  dependencies = defaultDependencies,
  signal,
  text,
  voice,
}: {
  cacheKey: string
  dependencies?: TtsDependencies
  signal?: AbortSignal
  text: string
  voice?: string
}) => {
  const bytes = await requestTtsBytes({
    fetch: dependencies.fetch as typeof globalThis.fetch,
    signal,
    text,
    voice,
  })
  // Created only once the download finished, so a cancelled or failed request leaves no empty file
  const file = dependencies.createCacheFile(cacheKey)
  file.write(bytes)
  return file.uri
}

/**
 * Deletes the cached TTS files except the one at `keepUri`, which the native player may still
 * hold. Files are matched by name, since a listed URI can be spelled differently from the
 * stored one.
 */
export const pruneTtsCache = (
  keepUri?: string | null,
  directory: TtsCacheDirectory = getCacheDirectory(),
) => {
  const keepName = keepUri?.split("/").pop()

  let entries: ReturnType<TtsCacheDirectory["list"]>
  try {
    if (!directory.exists) {
      return
    }
    entries = directory.list()
  } catch {
    return
  }

  for (const entry of entries) {
    if (entry.name === keepName) {
      continue
    }

    try {
      entry.delete()
    } catch {
      // Best effort, the next prune tries again
    }
  }
}
