type LineHandler<T> = (data: T) => void | Promise<void>

/**
 * Read a Response body as a newline-delimited JSON stream.
 * Each complete line will be parsed and passed to onLine.
 */
export async function readNdjsonStream<T = unknown>(response: Response, onLine: LineHandler<T>) {
  const reader = response.body?.getReader()
  if (!reader) return

  const decoder = new TextDecoder()
  let buffer = ""

  const processLine = async (line: string) => {
    const trimmed = line.trim()
    if (!trimmed) return
    try {
      const json = JSON.parse(trimmed) as T
      await onLine(json)
    } catch (error) {
      console.error("Failed to parse NDJSON line:", error)
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      for (let i = 0; i < lines.length - 1; i++) {
        await processLine(lines[i]!)
      }
      buffer = lines.at(-1) || ""
    }

    if (buffer.trim()) {
      await processLine(buffer)
    }
  } finally {
    reader.releaseLock()
  }
}
