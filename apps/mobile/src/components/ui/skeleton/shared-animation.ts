/**
 * Runs one animation for any number of holders: it starts with the first holder and stops when
 * the last one lets go, so nothing keeps animating once no view shows it.
 *
 * Returns `hold`, which takes a hold and returns the function that releases it.
 */
export const createSharedAnimation = ({ start, stop }: { start: () => void; stop: () => void }) => {
  let holders = 0

  return function hold() {
    holders += 1
    if (holders === 1) {
      start()
    }

    let released = false
    return function release() {
      if (released) return
      released = true
      holders -= 1
      if (holders === 0) {
        stop()
      }
    }
  }
}
