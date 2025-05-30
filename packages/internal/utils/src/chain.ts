import { sleep } from "./utils"

export class Chain {
  private chain: Promise<void> = Promise.resolve()
  private abortController = new AbortController()

  next(fn: () => any | Promise<any>) {
    const { signal } = this.abortController
    this.chain = this.chain.then(() => {
      if (signal.aborted) {
        throw "Chain aborted"
      }
      return fn() || Promise.resolve()
    })
  }

  wait(ms: number): this {
    this.chain = this.chain.then(() => sleep(ms))
    return this
  }

  abort() {
    this.chain = Promise.resolve()
    this.abortController.abort()
    this.abortController = new AbortController()
  }
}
