/** Room in points past the safe area, on each side of the top of the window */
export interface WindowControlsInsets {
  left: number
  right: number
}

export const NO_WINDOW_CONTROLS_INSETS: WindowControlsInsets = { left: 0, right: 0 }

export interface WindowControlsInsetsSource {
  /** Missing from builds before it was added */
  getWindowControlsInsets?: () => Promise<WindowControlsInsets>
  addListener: (
    eventName: "onWindowControlsInsetsChange",
    listener: (insets: WindowControlsInsets) => void,
  ) => { remove: () => void }
}

const toInset = (value: number) => (Number.isFinite(value) && value > 0 ? value : 0)

/**
 * Holds the room the window controls of iPadOS 26 and later take in the top corner of the app
 * window, as the native side reports it. It asks once the first component subscribes, then follows
 * the changes; without the native side, as on Android or an older build, it stays empty.
 */
export const createWindowControlsInsetsStore = (source: WindowControlsInsetsSource | null) => {
  let insets = NO_WINDOW_CONTROLS_INSETS
  let started = false
  const listeners = new Set<() => void>()

  const set = (next: WindowControlsInsets) => {
    const left = toInset(next.left)
    const right = toInset(next.right)
    if (left === insets.left && right === insets.right) return
    insets = { left, right }
    for (const listener of listeners) {
      listener()
    }
  }

  const start = () => {
    if (started || !source?.getWindowControlsInsets) return
    started = true
    let hasChanged = false
    source.addListener("onWindowControlsInsetsChange", (next) => {
      hasChanged = true
      set(next)
    })
    // A change can arrive before the answer, which then is older than it
    source.getWindowControlsInsets().then(
      (next) => {
        if (!hasChanged) set(next)
      },
      () => {},
    )
  }

  return {
    getSnapshot: () => insets,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      start()
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
