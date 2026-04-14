import { fetch as expoFetch } from "expo/fetch"
import { Directory, File, Paths } from "expo-file-system"

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

const sanitizeCacheKey = (value: string) =>
  value
    .trim()
    .replaceAll(/[^\w-]+/g, "_")
    .replaceAll(/^_+|_+$/g, "") || "tts"

const createCacheFile = (cacheKey: string): TtsCacheFile => {
  const directory = new Directory(Paths.cache, "tts")
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
  fetch: expoFetch,
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
  const file = dependencies.createCacheFile(cacheKey)
  file.write(
    await requestTtsBytes({
      fetch: dependencies.fetch as typeof globalThis.fetch,
      signal,
      text,
      voice,
    }),
  )
  return file.uri
}
