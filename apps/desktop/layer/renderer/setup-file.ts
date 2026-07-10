// @ts-nocheck
import "fake-indexeddb/auto"

import { enableMapSet } from "immer"

const createMemoryStorage = () => {
  const data = new Map()

  return {
    get length() {
      return data.size
    },
    clear() {
      data.clear()
    },
    getItem(key) {
      return data.get(String(key)) ?? null
    },
    key(index) {
      return Array.from(data.keys())[index] ?? null
    },
    removeItem(key) {
      data.delete(String(key))
    },
    setItem(key, value) {
      data.set(String(key), String(value))
    },
  }
}

const testNavigator = globalThis.navigator ?? {
  onLine: true,
  userAgent: "node",
}

const testWindow = globalThis.window ?? {}

globalThis.window = testWindow

Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: testNavigator,
})

Object.defineProperties(testWindow, {
  location: {
    configurable: true,
    value: testWindow.location ?? new URL("https://example.com"),
  },
  __dbIsReady: {
    configurable: true,
    value: true,
  },
  addEventListener: {
    configurable: true,
    writable: true,
    value: testWindow.addEventListener?.bind(testWindow) ?? (() => {}),
  },
  navigator: {
    configurable: true,
    value: testNavigator,
  },
})

const localStorageMock = testWindow.localStorage ?? createMemoryStorage()
const sessionStorageMock = testWindow.sessionStorage ?? createMemoryStorage()

Object.defineProperties(testWindow, {
  localStorage: {
    configurable: true,
    value: localStorageMock,
  },
  sessionStorage: {
    configurable: true,
    value: sessionStorageMock,
  },
})

Object.defineProperties(globalThis, {
  localStorage: {
    configurable: true,
    value: localStorageMock,
  },
  sessionStorage: {
    configurable: true,
    value: sessionStorageMock,
  },
})

enableMapSet()
