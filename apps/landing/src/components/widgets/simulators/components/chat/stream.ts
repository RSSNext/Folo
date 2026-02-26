export interface StreamOptions {
  onUpdate: (slice: string) => void
  onDone?: () => void
  intervalMs?: number
  chunkSize?: number
  initialDelayMs?: number
}

export interface StreamHandle {
  cancel: () => void
  done: Promise<void>
}

/**
 * Stream a long string by periodically emitting growing slices of the text.
 * Returns a handle with a cancel function and a promise that resolves when streaming completes.
 */
export function streamText(text: string, options: StreamOptions): StreamHandle {
  const {
    onUpdate,
    onDone,
    intervalMs = 70,
    chunkSize,
    initialDelayMs = 0,
  } = options

  const totalLength = text.length
  const size =
    typeof chunkSize === 'number' && chunkSize > 0
      ? chunkSize
      : Math.max(12, Math.ceil(totalLength / 90))

  let index = Math.min(size, totalLength)
  let interval: number | null = null
  let startTimeout: number | null = null

  let resolveDone: () => void
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve
  })

  const start = () => {
    // Emit first slice
    onUpdate(text.slice(0, index))

    interval = window.setInterval(() => {
      index = Math.min(totalLength, index + size)
      onUpdate(text.slice(0, index))

      if (index >= totalLength && interval) {
        window.clearInterval(interval)
        interval = null
        onDone?.()
        resolveDone()
      }
    }, intervalMs)
  }

  if (initialDelayMs > 0) {
    startTimeout = window.setTimeout(start, initialDelayMs)
  } else {
    start()
  }

  const cancel = () => {
    if (startTimeout) {
      window.clearTimeout(startTimeout)
      startTimeout = null
    }
    if (interval) {
      window.clearInterval(interval)
      interval = null
    }
  }

  return { cancel, done }
}
