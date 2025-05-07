import type { UseStore } from "idb-keyval"
import { get, promisifyRequest, set } from "idb-keyval"

import type { StoreImageType } from "."

function createStore(dbName: string, storeName: string): UseStore {
  const request = indexedDB.open(dbName)
  request.onupgradeneeded = () => {
    const objectStore = request.result.createObjectStore(storeName)

    objectStore.createIndex("src", "src", { unique: true })
    return objectStore
  }
  const dbp = promisifyRequest(request)

  return (txMode, callback) =>
    dbp.then((db) => callback(db.transaction(storeName, txMode).objectStore(storeName)))
}

const db = createStore("FOLLOW_IMAGE_DIMENSIONS", "image-dimensions")
export const getImageDimensionsFromDb = async (url: string) => await get(url, db)

export const saveImageDimensionsToDb = async (url: string, dimensions: StoreImageType) => {
  const oldData = await getImageDimensionsFromDb(url)

  await set(
    url,
    {
      ...oldData,
      ...dimensions,
    },
    db,
  )
}

export const clearImageDimensionsDb = async () => {
  const store = await db("readwrite", (store) => store.clear())
  return store
}
