// this polyfill can be removed once we drop support for Firefox v121 (after
// June 24 2025) Chrome v119 (after November 14, 2025).

if (Promise.withResolvers === undefined) {
  Promise.withResolvers = function withResolvers<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void
    let reject!: (reason?: unknown) => void
    const promise = new this<T>((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject }
  }
}

export {}
