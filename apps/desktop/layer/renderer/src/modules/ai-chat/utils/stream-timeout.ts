/**
 * Errors the stream when nothing arrives for `timeout` ms. Unlike an abort, which the AI SDK
 * treats as the user stopping the reply, an error puts the chat in its error state.
 */
export const withInactivityTimeout = <T>(
  stream: ReadableStream<T>,
  timeout: number,
  createError: () => Error,
): ReadableStream<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined

  return stream.pipeThrough(
    new TransformStream<T, T>({
      start(controller) {
        timer = setTimeout(() => controller.error(createError()), timeout)
      },
      transform(chunk, controller) {
        clearTimeout(timer)
        timer = setTimeout(() => controller.error(createError()), timeout)
        controller.enqueue(chunk)
      },
      flush() {
        clearTimeout(timer)
      },
    }),
  )
}
