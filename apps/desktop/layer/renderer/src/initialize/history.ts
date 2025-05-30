import { nextFrame } from "@follow/utils/dom"
import { jotaiStore } from "@follow/utils/jotai"
import { atom } from "jotai"

import { router } from "~/router"

const historyAtom = atom<string[]>([])

declare global {
  interface History {
    stack: string[]

    returnBack: (to?: string) => void

    get isPop(): boolean
  }
}

let __isPop = false
const F = {} as { isPop: boolean }
let resetTimer: any = null
Object.defineProperty(F, "isPop", {
  get() {
    return __isPop
  },
  set(value) {
    if (!value) return

    resetTimer && clearTimeout(resetTimer)
    resetTimer = setTimeout(() => {
      __isPop = false
    }, 1200)

    __isPop = true
  },
})

export const registerHistoryStack = () => {
  const onPopState = (e: PopStateEvent) => {
    F.isPop = true

    const url = e.state?.url
    if (url) {
      jotaiStore.set(historyAtom, jotaiStore.get(historyAtom).slice(0, -1))
    }
  }
  window.addEventListener("popstate", onPopState)

  const unsub = router.subscribe((e) => {
    const url = e.location.pathname + e.location.search
    jotaiStore.set(historyAtom, [...jotaiStore.get(historyAtom), url])
  })

  Object.defineProperty(window.history, "stack", {
    get() {
      return jotaiStore.get(historyAtom)
    },
    enumerable: false,
  })

  Object.defineProperty(window.history, "returnBack", {
    value: (to?: string) => {
      const stack = jotaiStore.get(historyAtom)
      F.isPop = true
      const last = stack.at(-1)

      to = typeof to === "string" ? to : last

      if (!last || last !== to) {
        window.router.navigate(to ?? "/")

        nextFrame(() => {
          jotaiStore.set(historyAtom, [])
        })
      } else {
        window.history.back()
      }
    },
    enumerable: false,
  })

  Object.defineProperty(window.history, "isPop", {
    get() {
      return F.isPop
    },
    enumerable: false,
  })

  return () => {
    window.removeEventListener("popstate", onPopState)

    unsub()
  }
}
