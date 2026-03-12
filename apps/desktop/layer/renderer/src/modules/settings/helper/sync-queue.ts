import type { AISettings, GeneralSettings, UISettings } from "@follow/shared/settings/interface"
import { whoami } from "@follow/store/user/getters"
import { tracker } from "@follow/tracker"
import { EventBus } from "@follow/utils/event-bus"
import { getStorageNS } from "@follow/utils/ns"
import { isEmptyObject, sleep } from "@follow/utils/utils"
import type { SettingsTab } from "@follow-app/client-sdk"
import { FollowAPIError } from "@follow-app/client-sdk"
import type { PrimitiveAtom } from "jotai"

import { __aiSettingAtom, aiServerSyncWhiteListKeys, getAISettings } from "~/atoms/settings/ai"
import {
  __generalSettingAtom,
  generalServerSyncWhiteListKeys,
  getGeneralSettings,
} from "~/atoms/settings/general"
import { __uiSettingAtom, getUISettings, uiServerSyncWhiteListKeys } from "~/atoms/settings/ui"
import { followClient } from "~/lib/api-client"
import { jotaiStore } from "~/lib/jotai"
import { settings } from "~/queries/settings"

type SettingMapping = {
  appearance: UISettings
  general: GeneralSettings
  ai: AISettings
}

const pickSyncPayload = <T extends object>(payload: T, keys: readonly (keyof T | string)[]) => {
  const nextPayload = {} as Partial<T>
  const record = payload as Record<string, unknown>

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      nextPayload[key as keyof T] = record[key as string] as T[keyof T]
    }
  }

  return nextPayload
}

const localSettingGetterMap = {
  appearance: () => getUISettings(),
  general: () => getGeneralSettings(),
  ai: () => getAISettings(),
}

const createInternalSetter =
  <T>(atom: PrimitiveAtom<T>) =>
  (payload: Partial<T>) => {
    const current = jotaiStore.get(atom)
    jotaiStore.set(atom, { ...current, ...payload })
  }

const localSettingSetterMap = {
  appearance: createInternalSetter(__uiSettingAtom),
  general: createInternalSetter(__generalSettingAtom),
  ai: createInternalSetter(__aiSettingAtom),
}

const settingWhiteListMap = {
  appearance: uiServerSyncWhiteListKeys,
  general: generalServerSyncWhiteListKeys,
  ai: aiServerSyncWhiteListKeys,
}

const bizSettingKeyToTabMapping = {
  ui: "appearance",
  general: "general",
  ai: "ai",
}

const isUnauthorizedError = (error: unknown) => {
  if (error instanceof FollowAPIError) {
    return error.status === 401
  }

  if (error && typeof error === "object" && "status" in error) {
    return Number((error as { status?: unknown }).status) === 401
  }

  return false
}

export type SettingSyncTab = keyof SettingMapping
export interface SettingSyncQueueItem<T extends SettingSyncTab = SettingSyncTab> {
  tab: T
  payload: Partial<SettingMapping[T]>
  date: number
}

interface PersistedSettingSyncQueue {
  ownerUserId: string | null
  queue: SettingSyncQueueItem[]
}

class SettingSyncQueue {
  queue: SettingSyncQueueItem[] = []
  private ownerUserId: string | null = null

  private getCurrentUserId() {
    return whoami()?.id ?? null
  }

  private bindQueueOwner(currentUserId: string) {
    if (this.ownerUserId === null) {
      this.ownerUserId = currentUserId
      return
    }

    if (this.ownerUserId !== currentUserId) {
      this.ownerUserId = currentUserId
      this.queue = []
    }
  }

  private reportSyncError(stage: "flush" | "syncLocal", error: unknown) {
    void tracker.manager.captureException(error, {
      module: "setting_sync",
      stage,
    })
  }

  private disposers: (() => void)[] = []
  async init() {
    this.teardown()

    this.load()

    const d1 = EventBus.subscribe("SETTING_CHANGE_EVENT", (data) => {
      const currentUserId = this.getCurrentUserId()
      if (!currentUserId) return

      this.bindQueueOwner(currentUserId)

      const tab = bizSettingKeyToTabMapping[data.key]
      if (!tab) return

      const nextPayload = pickSyncPayload(data.payload, settingWhiteListMap[tab])
      if (isEmptyObject(nextPayload)) return
      this.enqueue(tab, nextPayload)
    })
    const onlineHandler = () => (this.chain = this.chain.finally(() => this.flush()))

    window.addEventListener("online", onlineHandler)
    const d2 = () => window.removeEventListener("online", onlineHandler)

    const unloadHandler = () => this.persist()

    window.addEventListener("beforeunload", unloadHandler)
    const d3 = () => window.removeEventListener("beforeunload", unloadHandler)

    this.disposers.push(d1, d2, d3)
  }

  teardown() {
    for (const disposer of this.disposers) {
      disposer()
    }
    this.queue = []
    this.ownerUserId = null
  }

  private readonly storageKey = getStorageNS("setting_sync_queue")
  private persist() {
    if (this.queue.length === 0) {
      localStorage.removeItem(this.storageKey)
      return
    }

    const payload: PersistedSettingSyncQueue = {
      ownerUserId: this.ownerUserId,
      queue: this.queue,
    }
    localStorage.setItem(this.storageKey, JSON.stringify(payload))
  }

  private load() {
    const queue = localStorage.getItem(this.storageKey)
    localStorage.removeItem(this.storageKey)
    if (!queue) {
      return
    }

    const currentUserId = this.getCurrentUserId()

    try {
      const parsed = JSON.parse(queue) as unknown
      if (Array.isArray(parsed)) {
        // Backward compatibility: legacy versions persisted the queue array directly.
        this.queue = parsed
        this.ownerUserId = currentUserId
      } else if (!parsed || typeof parsed !== "object") {
        this.queue = []
        this.ownerUserId = null
        return
      } else {
        const payload = parsed as Partial<PersistedSettingSyncQueue>
        this.queue = Array.isArray(payload.queue) ? payload.queue : []
        if (typeof payload.ownerUserId === "string" || payload.ownerUserId === null) {
          this.ownerUserId = payload.ownerUserId
        } else {
          // Backward compatibility for payloads without owner information.
          this.ownerUserId = currentUserId
        }
      }
    } catch {
      /* empty */
    }

    if (!currentUserId) {
      return
    }

    this.bindQueueOwner(currentUserId)
  }

  private chain = Promise.resolve()

  private threshold = 1000
  private flushScheduled = false

  async enqueue<T extends SettingSyncTab>(tab: T, payload: Partial<SettingMapping[T]>) {
    const currentUserId = this.getCurrentUserId()
    if (!currentUserId) {
      return
    }

    this.bindQueueOwner(currentUserId)

    const now = Date.now()
    if (isEmptyObject(payload)) {
      return
    }
    this.queue.push({
      tab,
      payload,
      date: now,
    })

    if (this.flushScheduled) {
      return
    }

    this.flushScheduled = true
    this.chain = this.chain
      .finally(() => sleep(this.threshold))
      .finally(async () => {
        try {
          await this.flush()
        } finally {
          this.flushScheduled = false
        }
      })
  }

  private async flush() {
    const currentUserId = this.getCurrentUserId()
    if (!currentUserId) {
      return
    }

    this.bindQueueOwner(currentUserId)

    if (navigator.onLine === false) {
      return
    }

    const groupedTab = {} as Record<SettingSyncTab, any>

    const referenceMap = {} as Record<SettingSyncTab, Set<SettingSyncQueueItem>>
    for (const item of this.queue) {
      if (!groupedTab[item.tab]) {
        groupedTab[item.tab] = {}
      }

      referenceMap[item.tab] ||= new Set()
      referenceMap[item.tab].add(item)

      groupedTab[item.tab] = {
        ...groupedTab[item.tab],
        ...item.payload,
      }
    }

    const promises = [] as Promise<any>[]
    for (const tab in groupedTab) {
      const json = pickSyncPayload(groupedTab[tab], settingWhiteListMap[tab])

      if (isEmptyObject(json)) {
        continue
      }

      const promise = followClient.api.settings
        .update({
          tab: tab as SettingsTab,
          ...json,
        })
        .then(() => {
          // remove from queue
          for (const item of referenceMap[tab]) {
            const index = this.queue.indexOf(item)
            if (index !== -1) {
              this.queue.splice(index, 1)
            }
          }
        })
      // TODO rollback or retry
      promises.push(promise)
    }

    try {
      await Promise.all(promises)
    } catch (error) {
      if (isUnauthorizedError(error)) {
        this.queue = []
        this.ownerUserId = currentUserId
        return
      }

      this.reportSyncError("flush", error)
    }
  }

  replaceRemote(tab?: SettingSyncTab) {
    const currentUserId = this.getCurrentUserId()
    if (!currentUserId) {
      return this.chain
    }

    this.bindQueueOwner(currentUserId)

    if (!tab) {
      const promises = [] as Promise<any>[]
      for (const tab in localSettingGetterMap) {
        const payload = pickSyncPayload(localSettingGetterMap[tab](), settingWhiteListMap[tab])

        const promise = followClient.api.settings.update({
          tab: tab as SettingsTab,
          ...payload,
        })

        promises.push(promise)
      }

      this.chain = this.chain.finally(() => Promise.all(promises))
      return this.chain
    } else {
      const payload = pickSyncPayload(localSettingGetterMap[tab](), settingWhiteListMap[tab])

      this.chain = this.chain.finally(() =>
        followClient.api.settings.update({
          tab: tab as SettingsTab,
          ...payload,
        }),
      )

      return this.chain
    }
  }

  async syncLocal() {
    const currentUserId = this.getCurrentUserId()
    if (!currentUserId) return

    this.bindQueueOwner(currentUserId)

    const remoteSettings = await settings
      .get()
      .prefetch()
      .catch((error) => {
        if (isUnauthorizedError(error)) {
          this.queue = []
          this.ownerUserId = currentUserId
          return null
        }

        this.reportSyncError("syncLocal", error)
        return null
      })

    if (!remoteSettings) return

    if (isEmptyObject(remoteSettings.settings)) return

    for (const tab in remoteSettings.settings) {
      const remoteSettingPayload = remoteSettings.settings[tab]
      const updated = remoteSettings.updated[tab]

      if (!updated) {
        continue
      }

      const remoteUpdatedDate = new Date(updated).getTime()

      const localSettings = localSettingGetterMap[tab]()
      const localSettingsUpdated = localSettings.updated

      if (!localSettingsUpdated || remoteUpdatedDate > localSettingsUpdated) {
        // Use remote and update local
        const nextPayload = pickSyncPayload(remoteSettingPayload, settingWhiteListMap[tab])

        if (isEmptyObject(nextPayload)) {
          continue
        }

        const setter = localSettingSetterMap[tab]

        nextPayload.updated = remoteUpdatedDate

        setter(nextPayload)
      }
    }
  }
}

export const settingSyncQueue = new SettingSyncQueue()
