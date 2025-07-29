import type { Credentials } from "@eneris/push-receiver/dist/types"
import Store from "electron-store"

// @keep-sorted
type StoreData = {
  "notifications-credentials"?: Credentials | null
  "notifications-persistent-ids"?: string[] | null
  appearance?: "light" | "dark" | "system" | null
  cacheSizeLimit?: number | null
  minimizeToTray?: boolean | null
  proxy?: string | null
  qbittorrentSID?: string | null
  user?: string | null
  windowState?: {
    height: number
    width: number
    x: number
    y: number
  } | null
}
export const store = new Store<StoreData>({ name: "db" })

export enum StoreKey {
  CacheSizeLimit = "cacheSizeLimit",
}
