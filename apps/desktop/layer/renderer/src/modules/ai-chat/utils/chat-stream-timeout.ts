import type { UIMessageChunk } from "ai"

// The server ends a stalled reply itself and says why in an error chunk. Until the model starts
// to answer a step, and while a tool runs, it waits 5 minutes, longer while the provider streams
// reasoning the reply does not show, but never past its 20-minute cap for a whole reply. Once the
// answer streams, it ends the reply after 90 seconds of silence. The client waits longer in both
// phases, so its own timeout only ends a reply whose connection died.

/** The wait before the model answers a step and while a tool runs: past the server's cap. */
export const CHAT_STREAM_WAITING_TIMEOUT = 21 * 60_000

/** The wait while the model streams its answer: past the server's 90 seconds. */
export const CHAT_STREAM_IDLE_TIMEOUT = 2 * 60_000

// Chunks after which the model has yet to answer: a step starts or a tool runs.
const WAITING_FOR_MODEL_CHUNKS = new Set<string>([
  "start",
  "start-step",
  "finish-step",
  "reset-step",
  "tool-input-available",
  "tool-input-error",
  "tool-approval-request",
  "tool-approval-response",
  "tool-output-available",
  "tool-output-error",
  "tool-output-denied",
])

// Chunks of an answer the model is streaming. Others, such as metadata, leave the wait as it is.
const MODEL_OUTPUT_CHUNKS = new Set<string>([
  "text-start",
  "text-delta",
  "text-end",
  "reasoning-start",
  "reasoning-delta",
  "reasoning-end",
  "reasoning-file",
  "tool-input-start",
  "tool-input-delta",
  "source-url",
  "source-document",
  "file",
])

/**
 * Returns the wait for the next chunk of an AI chat reply, given the chunk that just arrived
 * (none at the start), following the same phases as the server's timeout.
 */
export const createChatStreamTimeout = () => {
  let waitingForModel = true

  return (lastChunk: Pick<UIMessageChunk, "type"> | undefined) => {
    if (lastChunk) {
      if (WAITING_FOR_MODEL_CHUNKS.has(lastChunk.type)) {
        waitingForModel = true
      } else if (MODEL_OUTPUT_CHUNKS.has(lastChunk.type)) {
        waitingForModel = false
      }
    }

    return waitingForModel ? CHAT_STREAM_WAITING_TIMEOUT : CHAT_STREAM_IDLE_TIMEOUT
  }
}
