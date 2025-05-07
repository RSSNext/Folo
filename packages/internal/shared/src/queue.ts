export class AsyncQueue {
  private maxConcurrent: number
  private queue: (() => Promise<any>)[]
  private activeCount: number

  constructor(maxConcurrent: number) {
    this.maxConcurrent = maxConcurrent
    this.queue = []
    this.activeCount = 0
  }

  private async runNext() {
    if (this.activeCount >= this.maxConcurrent || this.queue.length === 0) {
      return
    }

    this.activeCount++
    const request = this.queue.shift()!

    try {
      return await request()
    } catch (error) {
      console.error("Request failed", error)
    } finally {
      this.activeCount--
      this.runNext() // Start the next request after this one finishes
    }
  }

  add(request: () => Promise<any>) {
    this.queue.push(request)
    return this.runNext()
  }

  addMultiple(requests: (() => Promise<any>)[]) {
    this.queue.push(...requests)
    this.runNext()
  }
}
