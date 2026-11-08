import type { IpcServices } from "@follow/electron-main"

import { ipcServices } from "~/lib/client"

// Deliberately outside the settings atom: never account-synced or settings-exported.
export const notionLocalStorageKey = "follow:integration:notion"
type Connection = NonNullable<Parameters<IpcServices["notion"]["hydrateLocalConnection"]>[0]>
type Service = Pick<
  IpcServices["notion"],
  | "hydrateLocalConnection"
  | "getStatus"
  | "beginSelection"
  | "searchSources"
  | "selectSource"
  | "getMapping"
  | "setMapping"
  | "finalizeLocalConnection"
  | "disconnect"
  | "cancelSelection"
  | "saveArticle"
>
type Storage = Pick<globalThis.Storage, "getItem" | "setItem" | "removeItem">

export function createNotionLocalClient(getService: () => Service, getStorage: () => Storage) {
  let queue = Promise.resolve()
  let epoch = 0
  const checkEpoch = (value: number) => {
    if (value !== epoch) throw new Error("Notion operation cancelled")
  }
  const read = (): Connection | null => {
    let raw: string | null
    try {
      raw = getStorage().getItem(notionLocalStorageKey)
    } catch {
      throw new Error("NOTION_LOCAL_STORAGE_UNAVAILABLE")
    }
    if (!raw) return null
    try {
      const value = JSON.parse(raw) as Connection
      if (!value || typeof value.token !== "string" || typeof value.dataSourceId !== "string")
        throw new Error("NOTION_LOCAL_STORAGE_INVALID")
      return value
    } catch {
      throw new Error("NOTION_LOCAL_STORAGE_INVALID")
    }
  }
  const enqueue = <T>(operation: (version: number) => Promise<T>): Promise<T> => {
    const version = epoch
    const pending = queue.then(() => {
      checkEpoch(version)
      return operation(version)
    })
    queue = pending.then(
      () => {},
      () => {},
    )
    return pending
  }
  const run = <T>(
    operation: (service: Service, previous: Connection | null, version: number) => Promise<T>,
  ) =>
    enqueue(async (version) => {
      const previous = read()
      const service = getService()
      await service.hydrateLocalConnection(previous)
      checkEpoch(version)
      return operation(service, previous, version)
    })
  const persist = async (
    service: Service,
    previous: Connection | null,
    next: Connection,
    version: number,
  ) => {
    checkEpoch(version)
    try {
      getStorage().setItem(notionLocalStorageKey, JSON.stringify(next))
    } catch {
      await service.hydrateLocalConnection(previous)
      throw new Error("NOTION_LOCAL_STORAGE_UNAVAILABLE")
    }
    // Legacy ciphertext is removed only after local persistence succeeds.
    await service.finalizeLocalConnection()
  }
  return {
    getStatus: () => run((service) => service.getStatus()),
    beginSelection: (token?: string) => run((service) => service.beginSelection(token)),
    searchSources: (query: string, cursor?: string) =>
      run((service) => service.searchSources(query, cursor)),
    cancelSelection: () => run((service) => service.cancelSelection()),
    selectSource: (id: string) =>
      run(async (service, previous, version) => {
        await persist(service, previous, await service.selectSource(id), version)
      }),
    getMapping: () => run((service) => service.getMapping()),
    setMapping: (mapping: Parameters<Service["setMapping"]>[0]) =>
      run(async (service, previous, version) => {
        const next = await service.setMapping(mapping)
        if (next) await persist(service, previous, next, version)
      }),
    saveArticle: (article: Parameters<Service["saveArticle"]>[0]) =>
      run((service) => service.saveArticle(article)),
    clearForAccountChange: async () => {
      // Do not wait for an article/image upload queue during account cleanup.
      epoch++
      let failed = false
      try {
        getStorage().removeItem(notionLocalStorageKey)
      } catch {
        failed = true
      }
      try {
        await getService().disconnect()
      } catch {
        failed = true
      }
      if (failed) throw new Error("Notion credential cleanup failed")
    },
    disconnect: () =>
      enqueue(async (version) => {
        let previous: string | null
        try {
          previous = getStorage().getItem(notionLocalStorageKey)
          getStorage().removeItem(notionLocalStorageKey)
        } catch {
          throw new Error("NOTION_LOCAL_STORAGE_UNAVAILABLE")
        }
        try {
          await getService().disconnect()
        } catch {
          try {
            if (previous && version === epoch) getStorage().setItem(notionLocalStorageKey, previous)
          } catch {
            /* Report a fixed error only. */
          }
          throw new Error("Notion disconnect failed")
        }
      }),
  }
}

export const notionLocalClient = createNotionLocalClient(
  () => {
    if (!ipcServices) throw new Error("Desktop integration unavailable")
    return ipcServices.notion
  },
  () => localStorage,
)
