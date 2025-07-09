import type { GeneralSettings, UISettings } from "@follow/shared/settings/interface"
import { isEmptyObject, jotaiStore, sleep } from "@follow/utils"
import { EventBus } from "@follow/utils/event-bus"
import { omit } from "es-toolkit/compat"
import type { PrimitiveAtom } from "jotai"

import {
  __generalSettingAtom,
  generalServerSyncWhiteListKeys,
  getGeneralSettings,
} from "@/src/atoms/settings/general"
import { __uiSettingAtom, getUISettings, uiServerSyncWhiteListKeys } from "@/src/atoms/settings/ui"
import { apiClient } from "@/src/lib/api-fetch"
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

export type SettingSyncTab = keyof SettingMapping
export interface SettingSyncQueueItem<T extends SettingSyncTab = SettingSyncTab> {
  tab: T
  payload: Partial<SettingMapping[T]>
  date: number
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

  private disposers: (() => void)[] = []
  async init() {
    this.teardown()

    this.load()

    const d1 = EventBus.subscribe("SETTING_CHANGE_EVENT", (data) => {
      const tab = bizSettingKeyToTabMapping[data.key] as SettingSyncTab
      if (!tab) return

      const nextPayload = omit(data.payload, omitKeys, settingWhiteListMap[tab])
      if (isEmptyObject(nextPayload)) return
      this.enqueue(tab, nextPayload)

      this.persist()
    })

    this.disposers.push(d1)
  }

  teardown() {
    for (const disposer of this.disposers) {
      disposer()
    }
    this.queue = []
  }

  private readonly storageKey = "setting_sync_queue"
  private async persist() {
    if (this.queue.length === 0) {
      return
    }
    kv.set(this.storageKey, JSON.stringify(this.queue))
  }

  private async load() {
    const queue = await kv.get(this.storageKey)
    kv.delete(this.storageKey)
    if (!queue) {
      return
    }

    try {
      this.queue = JSON.parse(queue)
    } catch {
      /* empty */
    }
  }

  private chain = Promise.resolve()

  private threshold = 1000
  private enqueueTime = Date.now()

  async enqueue<T extends SettingSyncTab>(tab: T, payload: Partial<SettingMapping[T]>) {
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
      const promise = apiClient.settings[":tab"]
        .$patch({
          param: {
            tab,
          },
          json,
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

    await Promise.all(promises)
  }

  replaceRemote(tab?: SettingSyncTab) {
    if (!tab) {
      const promises = [] as Promise<any>[]
      for (const tab in localSettingGetterMap) {
        const payload = localSettingGetterMap[tab as SettingSyncTab]()
        const promise = apiClient.settings[":tab"].$patch({
          param: {
            tab,
          },
          json: payload,
        })

        promises.push(promise)
      }

      this.chain = this.chain.finally(() => Promise.all(promises))
      return this.chain
    } else {
      const payload = localSettingGetterMap[tab]()

      this.chain = this.chain.finally(() =>
        apiClient.settings[":tab"].$patch({
          param: {
            tab,
          },
          json: payload,
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
    const promise = apiClient.settings.$get({ query: {} })
    this.pendingPromise = promise.finally(() => {
      this.pendingPromise = null
    })
    return promise
  }
  async syncLocal() {
    const remoteSettings = await this.fetchSettingRemote()

    if (!remoteSettings) return
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log("remote settings:", remoteSettings)
    }

    if (isEmptyObject(remoteSettings.settings)) return

    for (const tab in remoteSettings.settings) {
      const remoteSettingPayload = remoteSettings.settings[tab]
      const updated = remoteSettings.updated[tab]

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
