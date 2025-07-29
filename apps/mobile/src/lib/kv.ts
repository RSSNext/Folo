import Storage from "expo-sqlite/kv-store"

class KV {
  setSync(key: string, value: string) {
    Storage.setItemSync(key, value)
  }

  getSync(key: string) {
    return Storage.getItemSync(key)
  }

  set(key: string, value: string) {
    Storage.setItem(key, value)
  }

  get(key: string) {
    return Storage.getItem(key)
  }

  delete(key: string) {
    return Storage.removeItem(key)
  }

  clear() {
    return Storage.clear()
  }

  keys() {
    return Storage.getAllKeysSync()
  }

  [Symbol.iterator]() {
    return Storage.getAllKeysSync().values()
  }
}

export const kv = new KV()
