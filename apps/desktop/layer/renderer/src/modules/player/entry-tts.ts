import { AudioPlayer, getAudioPlayerAtomValue, setAudioPlayerAtomValue } from "~/atoms/player"
import { followClient } from "~/lib/api-client"
import { toastFetchError } from "~/lib/error-parser"

const TTS_MIME_FALLBACK = "audio/ogg; codecs=opus"
const STREAM_PLACEHOLDER_SRC = "about:blank"

let activeTtsAbortController: AbortController | null = null
let activeTtsCleanup: (() => void) | null = null

type TtsAudioHandle = {
  url: string
  cleanup: () => void
}

type AudioContextConstructor =
  | (new (contextOptions?: AudioContextOptions | undefined) => AudioContext)
  | null

const getAudioContextConstructor = (): AudioContextConstructor => {
  if (typeof window === "undefined") {
    return null
  }

  const ctor =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

  return ctor ?? null
}

const getTtsMimeType = (response: Response) =>
  response.headers.get("content-type") ?? TTS_MIME_FALLBACK

const concatChunks = (chunks: Uint8Array[], totalLength: number) => {
  const merged = new Uint8Array(totalLength)
  let offset = 0

  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.length
  }

  return merged.buffer
}

const createBufferedTtsHandle = async (
  response: Response,
  signal: AbortSignal,
): Promise<TtsAudioHandle> => {
  const buffer = await response.arrayBuffer()
  if (signal.aborted) {
    throw new DOMException("Aborted", "AbortError")
  }

  const blob = new Blob([buffer], {
    type: getTtsMimeType(response),
  })

  const objectUrl = URL.createObjectURL(blob)

  return {
    url: objectUrl,
    cleanup: () => {
      URL.revokeObjectURL(objectUrl)
    },
  }
}

const createAudioContextStreamingHandle = (
  response: Response,
  entryId: string,
  signal: AbortSignal,
) => {
  const AudioContextCtor = getAudioContextConstructor()
  if (!AudioContextCtor || !response.body) {
    return null
  }

  const audioContext = new AudioContextCtor()
  const destination = audioContext.createMediaStreamDestination()
  const audioElement = AudioPlayer.audio
  const previousSrcObject = audioElement.srcObject
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let totalLength = 0
  let decodedDuration = 0
  let scheduledTime = audioContext.currentTime
  let playbackStartTime = scheduledTime
  let progressTimer: number | null = null
  let closed = false
  let decodePromise: Promise<void> | null = null
  let pendingDecode = false

  const updateProgress = () => {
    if (closed) {
      return
    }

    const played = Math.max(0, audioContext.currentTime - playbackStartTime)
    const playerState = getAudioPlayerAtomValue()

    if (playerState.entryId !== entryId) {
      return
    }

    audioElement.currentTime = played
    setAudioPlayerAtomValue({
      ...playerState,
      currentTime: played,
    })
  }

  const cleanup = () => {
    if (closed) {
      return
    }

    closed = true
    void reader.cancel().catch(() => {})
    audioElement.removeEventListener("play", onPlay)
    audioElement.removeEventListener("pause", onPause)

    if (audioElement.srcObject === destination.stream) {
      audioElement.srcObject = previousSrcObject ?? null
      if (!previousSrcObject) {
        audioElement.src = ""
        audioElement.load()
      }
    }

    if (progressTimer !== null) {
      window.clearInterval(progressTimer)
      progressTimer = null
    }

    const playerState = getAudioPlayerAtomValue()
    if (playerState.entryId === entryId) {
      setAudioPlayerAtomValue({
        ...playerState,
        isStream: false,
      })
    }

    void audioContext.close().catch(() => {})
  }

  const onPlay = () => {
    void audioContext.resume().catch(() => {})
  }

  const onPause = () => {
    void audioContext.suspend().catch(() => {})
  }

  audioElement.addEventListener("play", onPlay)
  audioElement.addEventListener("pause", onPause)
  audioElement.srcObject = destination.stream
  audioElement.src = ""
  audioElement.currentTime = 0
  audioElement.load()
  void audioElement.play().catch(() => {})
  void audioContext.resume().catch(() => {})

  setAudioPlayerAtomValue({
    ...getAudioPlayerAtomValue(),
    isStream: true,
  })

  const scheduleFromDecodedBuffer = (buffer: AudioBuffer) => {
    const totalDuration = buffer.duration
    const newDuration = totalDuration - decodedDuration
    if (newDuration <= 0) {
      decodedDuration = Math.max(decodedDuration, totalDuration)
      return
    }

    const { sampleRate } = buffer
    const startSample = Math.floor(decodedDuration * sampleRate)
    const endSample = Math.floor(totalDuration * sampleRate)
    const frameCount = endSample - startSample
    if (frameCount <= 0) {
      return
    }

    const segmentBuffer = audioContext.createBuffer(buffer.numberOfChannels, frameCount, sampleRate)
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = new Float32Array(frameCount)
      buffer.copyFromChannel(channelData, channel, startSample)
      segmentBuffer.copyToChannel(channelData, channel, 0)
    }

    const source = audioContext.createBufferSource()
    source.buffer = segmentBuffer
    source.connect(destination)
    source.start(scheduledTime)

    if (decodedDuration === 0) {
      playbackStartTime = scheduledTime
      if (progressTimer === null) {
        progressTimer = window.setInterval(updateProgress, 250)
      }
    }

    scheduledTime += frameCount / sampleRate
    decodedDuration = totalDuration

    const playerState = getAudioPlayerAtomValue()
    if (playerState.entryId === entryId) {
      setAudioPlayerAtomValue({
        ...playerState,
        duration: decodedDuration,
        status: "playing",
        isStream: true,
      })
    }
  }

  const decodeChunks = async () => {
    if (signal.aborted || closed) {
      return
    }

    const merged = concatChunks(chunks, totalLength)
    let decoded: AudioBuffer
    try {
      decoded = await audioContext.decodeAudioData(merged.slice(0))
    } catch {
      return
    }

    scheduleFromDecodedBuffer(decoded)
  }

  const requestDecode = () => {
    if (decodePromise) {
      pendingDecode = true
      return
    }

    decodePromise = decodeChunks()
      .catch(() => {
        // ignore decoding errors, will retry with more data
      })
      .finally(() => {
        decodePromise = null
        if (pendingDecode) {
          pendingDecode = false
          requestDecode()
        }
      })
  }

  const processStream = async () => {
    try {
      while (!closed) {
        if (signal.aborted) {
          break
        }

        const { done, value } = await reader.read()
        if (done) {
          break
        }

        if (value) {
          chunks.push(value)
          totalLength += value.length
          requestDecode()
        }
      }

      requestDecode()
      if (decodePromise) {
        await decodePromise
      }

      while (!closed && audioContext.currentTime < scheduledTime) {
        await new Promise((resolve) => window.setTimeout(resolve, 200))
      }

      const playerState = getAudioPlayerAtomValue()
      if (playerState.entryId === entryId) {
        setAudioPlayerAtomValue({
          ...playerState,
          currentTime: decodedDuration,
          status: "paused",
        })
      }
    } finally {
      cleanup()
    }
  }

  void processStream()

  return {
    cleanup,
  }
}

const resetActiveTtsCleanup = () => {
  const cleanup = activeTtsCleanup
  activeTtsCleanup = null
  cleanup?.()
}

const stopActiveTts = () => {
  activeTtsAbortController?.abort()
  activeTtsAbortController = null
  resetActiveTtsCleanup()
}

export const playEntryTts = async (entryId: string, { toastTitle }: { toastTitle: string }) => {
  stopActiveTts()

  const abortController = new AbortController()
  activeTtsAbortController = abortController

  try {
    const response = await followClient.api.ai.tts({ entryId }, { signal: abortController.signal })

    let handled = false
    if (response.body && getAudioContextConstructor()) {
      AudioPlayer.mount({
        type: "audio",
        entryId,
        src: STREAM_PLACEHOLDER_SRC,
        currentTime: 0,
      })

      const streamingHandle = createAudioContextStreamingHandle(
        response,
        entryId,
        abortController.signal,
      )

      if (streamingHandle) {
        activeTtsCleanup = streamingHandle.cleanup
        handled = true
      }
    }

    if (!handled) {
      const bufferedHandle = await createBufferedTtsHandle(response, abortController.signal)
      AudioPlayer.mount({
        type: "audio",
        entryId,
        src: bufferedHandle.url,
        currentTime: 0,
      })
      activeTtsCleanup = bufferedHandle.cleanup
    }
  } catch (error) {
    if (abortController.signal.aborted) {
      return
    }

    toastFetchError(error as Error, { title: toastTitle })
  } finally {
    if (activeTtsAbortController === abortController) {
      activeTtsAbortController = null
    }
  }
}
