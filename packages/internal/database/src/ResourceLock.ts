class ResourceLock {
  private locked = false
  private queue: Array<() => void> = []

  acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const tryAcquire = () => {
        if (!this.locked) {
          this.locked = true
          resolve(this.release.bind(this))
        } else {
          this.queue.push(tryAcquire)
        }
      }
      tryAcquire()
    })
  }

  private release() {
    this.locked = false
    const next = this.queue.shift()
    if (next) {
      next()
    }
  }
}

export const resourceLock = new ResourceLock()
