import type { AISettings, GeneralSettings, UISettings } from "@follow/shared/settings/interface"
import { EventBus } from "@follow/utils/event-bus"
import { getStorageNS } from "@follow/utils/ns"
import { isEmptyObject, sleep } from "@follow/utils/utils"
import { omit } from "es-toolkit/compat"
import type { PrimitiveAtom } from "jotai"

import { __aiSettingAtom, aiServerSyncWhiteListKeys, getAISettings } from "~/atoms/settings/ai"
import {
  __generalSettingAtom,
  generalServerSyncWhiteListKeys,
  getGeneralSettings,
} from "~/atoms/settings/general"
import { __uiSettingAtom, getUISettings, uiServerSyncWhiteListKeys } from "~/atoms/settings/ui"
import { apiClient } from "~/lib/api-fetch"
import { jotaiStore } from "~/lib/jotai"
import { settings } from "~/queries/settings"

type SettingMapping = {
  appearance: UISettings
  general: GeneralSettings
  ai: AISettings
}

const omitKeys = []

const localSettingGetterMap = {
  appearance: () => omit(getUISettings(), uiServerSyncWhiteListKeys, omitKeys),
  general: () => omit(getGeneralSettings(), generalServerSyncWhiteListKeys, omitKeys),
  ai: () => omit(getAISettings(), aiServerSyncWhiteListKeys, omitKeys),
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

export type SettingSyncTab = keyof SettingMapping
export interface SettingSyncQueueItem<T extends SettingSyncTab = SettingSyncTab> {
  tab: T
  payload: Partial<SettingMapping[T]>
  date: number
}
class SettingSyncQueue {
  queue: SettingSyncQueueItem[] = []

  private disposers: (() => void)[] = []
  async init() {
    this.teardown()

    this.load()

    const d1 = EventBus.subscribe("SETTING_CHANGE_EVENT", (data) => {
      const tab = bizSettingKeyToTabMapping[data.key]
      if (!tab) return

      const nextPayload = omit(data.payload, omitKeys, settingWhiteListMap[tab])
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
  }

  private readonly storageKey = getStorageNS("setting_sync_queue")
  private persist() {
    if (this.queue.length === 0) {
      return
    }
    localStorage.setItem(this.storageKey, JSON.stringify(this.queue))
  }

  private load() {
    const queue = localStorage.getItem(this.storageKey)
    localStorage.removeItem(this.storageKey)
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
      const json = omit(groupedTab[tab], omitKeys, settingWhiteListMap[tab])

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

    await Promise.all(promises)
  }

  replaceRemote(tab?: SettingSyncTab) {
    if (!tab) {
      const promises = [] as Promise<any>[]
      for (const tab in localSettingGetterMap) {
        const payload = localSettingGetterMap[tab]()
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

  async syncLocal() {
    const remoteSettings = await settings.get().prefetch()

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
        const nextPayload = omit(remoteSettingPayload, omitKeys, settingWhiteListMap[tab])

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
