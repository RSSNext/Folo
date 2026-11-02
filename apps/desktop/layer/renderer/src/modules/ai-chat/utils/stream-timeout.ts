// `cancel` runs when the readable side is cancelled or the writable side aborted; lib.dom does
// not declare it yet.
type CancelableTransformer<I, O> = Transformer<I, O> & {
  cancel?: (reason: unknown) => void
}

/**
 * Errors the stream when nothing arrives in time. `timeout` is the wait in ms, or returns it
 * given the chunk that just arrived (none at the start). Unlike an abort, which the AI SDK treats
 * as the user stopping the reply, an error puts the chat in its error state.
 */
export const withInactivityTimeout = <T>(
  stream: ReadableStream<T>,
  timeout: number | ((lastChunk: T | undefined) => number),
  createError: () => Error,
): ReadableStream<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined
  const getTimeout = typeof timeout === "number" ? () => timeout : timeout

  const restart = (controller: TransformStreamDefaultController<T>, lastChunk: T | undefined) => {
    clearTimeout(timer)
    timer = setTimeout(() => controller.error(createError()), getTimeout(lastChunk))
  }

  const transformer: CancelableTransformer<T, T> = {
    start(controller) {
      restart(controller, undefined)
    },
    transform(chunk, controller) {
      restart(controller, chunk)
      controller.enqueue(chunk)
    },
    flush() {
      clearTimeout(timer)
    },
    cancel() {
      clearTimeout(timer)
    },
  }

  return stream.pipeThrough(new TransformStream<T, T>(transformer))
}
