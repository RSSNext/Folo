export class NotFoundError extends Error {
  constructor(reason: string) {
    super(`Page not found: ${reason}`)
  }
}
export const callNotFound = (reason: string) => {
  throw new NotFoundError(reason)
}
