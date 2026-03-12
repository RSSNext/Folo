type LineHandler<T> = (data: T) => void | Promise<void>

const processNdjsonText = async <T = unknown>(text: string, onLine: LineHandler<T>) => {
  const lines = text.split("\n")

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    try {
      const json = JSON.parse(trimmed) as T
      await onLine(json)
    } catch (error) {
      console.error("Failed to parse NDJSON line:", error)
    }
  }
}

/**
 * Read a Response body as a newline-delimited JSON stream.
 * Each complete line will be parsed and passed to onLine.
 */
export async function readNdjsonStream<T = unknown>(response: Response, onLine: LineHandler<T>) {
  const reader = response.body?.getReader()
  if (!reader) {
    await processNdjsonText<T>(await response.text(), onLine)
    return
  }

  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      for (let i = 0; i < lines.length - 1; i++) {
        await processNdjsonText<T>(lines[i]!, onLine)
      }
      buffer = lines.at(-1) || ""
    }

    if (buffer.trim()) {
      await processNdjsonText<T>(buffer, onLine)
    }
  } finally {
    reader.releaseLock()
  }
}
