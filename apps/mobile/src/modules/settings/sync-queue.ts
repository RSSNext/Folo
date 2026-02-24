import type { GeneralSettings, UISettings } from "@follow/shared/settings/interface"
import { whoami } from "@follow/store/user/getters"
import { tracker } from "@follow/tracker"
import { isEmptyObject, jotaiStore, sleep } from "@follow/utils"
import { EventBus } from "@follow/utils/event-bus"
import type { SettingsTab } from "@follow-app/client-sdk"
import { FollowAPIError } from "@follow-app/client-sdk"
import { omit } from "es-toolkit/compat"
import type { PrimitiveAtom } from "jotai"

import {
  __generalSettingAtom,
  generalServerSyncWhiteListKeys,
  getGeneralSettings,
} from "@/src/atoms/settings/general"
import { __uiSettingAtom, getUISettings, uiServerSyncWhiteListKeys } from "@/src/atoms/settings/ui"
import { followClient } from "@/src/lib/api-client"
import { kv } from "@/src/lib/kv"

type SettingMapping = {
  appearance: UISettings
  general: GeneralSettings
}

const omitKeys: string[] = []

const localSettingGetterMap = {
  appearance: () => omit(getUISettings(), uiServerSyncWhiteListKeys, omitKeys),
  general: () => omit(getGeneralSettings(), generalServerSyncWhiteListKeys, omitKeys),
}

const createInternalSetter =
  <T>(atom: PrimitiveAtom<T>) =>
  (payload: T) => {
    const current = jotaiStore.get(atom)
    jotaiStore.set(atom, { ...current, ...payload })
  }

const localSettingSetterMap = {
  appearance: createInternalSetter(__uiSettingAtom),
  general: createInternalSetter(__generalSettingAtom),
}
const settingWhiteListMap = {
  appearance: uiServerSyncWhiteListKeys,
  general: generalServerSyncWhiteListKeys,
}

const bizSettingKeyToTabMapping = {
  ui: "appearance",
  general: "general",
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

declare module "@follow/utils/event-bus" {
  interface CustomEvent {
    SETTING_CHANGE_EVENT: {
      key: keyof typeof bizSettingKeyToTabMapping
      payload: any
    }
  }
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

  private async clearQueueAndPersist(ownerUserId: string | null) {
    this.queue = []
    this.ownerUserId = ownerUserId
    await kv.delete(this.storageKey)
  }

  private disposers: (() => void)[] = []
  async init() {
    this.teardown()

    const loadPromise = this.load()

    const d1 = EventBus.subscribe("SETTING_CHANGE_EVENT", (data) => {
      const currentUserId = this.getCurrentUserId()
      if (!currentUserId) return

      this.bindQueueOwner(currentUserId)

      const tab = bizSettingKeyToTabMapping[data.key] as SettingSyncTab
      if (!tab) return

      const nextPayload = omit(data.payload, omitKeys, settingWhiteListMap[tab])
      if (isEmptyObject(nextPayload)) return
      this.enqueue(tab, nextPayload)

      void this.persist()
    })

    this.disposers.push(d1)

    await loadPromise
  }

  teardown() {
    for (const disposer of this.disposers) {
      disposer()
    }
    this.queue = []
    this.ownerUserId = null
  }

  private readonly storageKey = "setting_sync_queue"
  private async persist() {
    if (this.queue.length === 0) {
      kv.delete(this.storageKey)
      return
    }

    const payload: PersistedSettingSyncQueue = {
      ownerUserId: this.ownerUserId,
      queue: this.queue,
    }
    kv.set(this.storageKey, JSON.stringify(payload))
  }

  private async load() {
    const queue = await kv.get(this.storageKey)
    await kv.delete(this.storageKey)
    if (!queue) {
      return
    }

    const currentUserId = this.getCurrentUserId()
    let nextQueue: SettingSyncQueueItem[] = []
    let nextOwnerUserId: string | null = null

    try {
      const parsed = JSON.parse(queue) as unknown
      if (Array.isArray(parsed)) {
        // Backward compatibility: legacy versions persisted the queue array directly.
        nextQueue = parsed
        nextOwnerUserId = currentUserId
      } else if (!parsed || typeof parsed !== "object") {
        return
      } else {
        const payload = parsed as Partial<PersistedSettingSyncQueue>
        nextQueue = Array.isArray(payload.queue) ? payload.queue : []
        if (typeof payload.ownerUserId === "string" || payload.ownerUserId === null) {
          nextOwnerUserId = payload.ownerUserId
        } else {
          // Backward compatibility for payloads without owner information.
          nextOwnerUserId = currentUserId
        }
      }
    } catch {
      return
    }

    // If queue state has already changed after init starts, keep the newer in-memory state.
    if (this.queue.length > 0 || this.ownerUserId !== null) {
      return
    }

    this.queue = nextQueue
    this.ownerUserId = nextOwnerUserId

    if (!currentUserId) {
      return
    }

    this.bindQueueOwner(currentUserId)
  }

  private chain = Promise.resolve()

  private threshold = 1000
  private enqueueTime = Date.now()

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

    if (now - this.enqueueTime > this.threshold) {
      this.chain = this.chain.then(() => sleep(this.threshold)).finally(() => this.flush())
      this.enqueueTime = Date.now()
    }
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
      const json = omit(
        groupedTab[tab as SettingSyncTab],
        omitKeys,
        settingWhiteListMap[tab as SettingSyncTab],
      )

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
          for (const item of referenceMap[tab as SettingSyncTab]) {
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
        await this.clearQueueAndPersist(currentUserId)
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
        const payload = localSettingGetterMap[tab as SettingSyncTab]()

        const promise = followClient.api.settings.update({
          tab: tab as SettingsTab,
          ...payload,
        })
        promises.push(promise)
      }

      this.chain = this.chain.finally(() => Promise.all(promises))
      return this.chain
    } else {
      const payload = localSettingGetterMap[tab]()

      this.chain = this.chain.finally(() =>
        followClient.api.settings.update({
          tab: tab as SettingsTab,
          ...payload,
        }),
      )

      return this.chain
    }
  }

  private pendingPromise: Promise<{
    code: 0
    settings: Record<string, any>
    updated: Record<string, string>
  }> | null = null

  private fetchSettingRemote() {
    if (this.pendingPromise) {
      return this.pendingPromise
    }
    const promise = followClient.api.settings.get()
    this.pendingPromise = promise.finally(() => {
      this.pendingPromise = null
    })
    return promise
  }
  async syncLocal() {
    const currentUserId = this.getCurrentUserId()
    if (!currentUserId) return

    this.bindQueueOwner(currentUserId)

    let remoteSettings: Awaited<ReturnType<typeof this.fetchSettingRemote>> | null = null
    try {
      remoteSettings = await this.fetchSettingRemote()
    } catch (error) {
      if (isUnauthorizedError(error)) {
        await this.clearQueueAndPersist(currentUserId)
        return
      }

      this.reportSyncError("syncLocal", error)
      return
    }

    if (!remoteSettings) return
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log("remote settings:", remoteSettings)
    }

    if (isEmptyObject(remoteSettings.settings)) return

    for (const tab in remoteSettings.settings) {
      const remoteSettingPayload = remoteSettings.settings[tab as SettingsTab]
      const updated = remoteSettings.updated[tab as SettingsTab]

      if (!updated) {
        continue
      }

      const remoteUpdatedDate = new Date(updated).getTime()

      const localSettings = localSettingGetterMap[tab as SettingSyncTab]()
      const localSettingsUpdated = (localSettings as { updated: number }).updated

      if (!localSettingsUpdated || remoteUpdatedDate > localSettingsUpdated) {
        // Use remote and update local
        const nextPayload: any = omit(
          remoteSettingPayload,
          omitKeys,
          settingWhiteListMap[tab as SettingSyncTab],
        )

        if (isEmptyObject(nextPayload)) {
          continue
        }

        const setter = localSettingSetterMap[tab as SettingSyncTab]

        nextPayload.updated = remoteUpdatedDate

        setter(nextPayload)
      }
    }
  }
}

export const settingSyncQueue = new SettingSyncQueue()
