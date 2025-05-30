declare global {
  // This flag controls write data in indexedDB, if it's false, pass data insert to db
  // When app not ready, it's false, after hydrate data, it's true
  // Or set is false when disable indexedDB in setting

  export let __dbIsReady: boolean

  interface Window {
    __dbIsReady: boolean
  }
}

export {}
