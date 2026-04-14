import type { AISettings, GeneralSettings, UISettings } from "@follow/shared/settings/interface"
import type { SpotlightSettings } from "@follow/shared/spotlight"
import {
  mergeAppearancePayloadWithSpotlightSettings,
  pickSpotlightPayloadFromRemoteAppearance,
  toAppearanceSpotlightPayload,
} from "@follow/shared/spotlight"
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
import {
  __spotlightSettingAtom,
  getSpotlightSettings,
  spotlightServerSyncWhiteListKeys,
} from "~/atoms/settings/spotlight"
import { __uiSettingAtom, getUISettings, uiServerSyncWhiteListKeys } from "~/atoms/settings/ui"
import { followClient } from "~/lib/api-client"
import { jotaiStore } from "~/lib/jotai"
import { settings } from "~/queries/settings"

type SettingMapping = {
  appearance: UISettings
  general: GeneralSettings
  ai: AISettings
  spotlight: SpotlightSettings
}
type SettingDomain = keyof SettingMapping
type RemoteSettingsTab = "appearance" | "general" | "ai"

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
  spotlight: () => getSpotlightSettings(),
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
  spotlight: createInternalSetter(__spotlightSettingAtom),
}

const settingWhiteListMap = {
  appearance: uiServerSyncWhiteListKeys,
  general: generalServerSyncWhiteListKeys,
  ai: aiServerSyncWhiteListKeys,
  spotlight: spotlightServerSyncWhiteListKeys,
}

const remoteTabMap: Record<SettingDomain, RemoteSettingsTab> = {
  appearance: "appearance",
  general: "general",
  ai: "ai",
  spotlight: "appearance",
}

const remoteTabToDomainMap: Record<RemoteSettingsTab, SettingDomain[]> = {
  appearance: ["appearance", "spotlight"],
  general: ["general"],
  ai: ["ai"],
}

const bizSettingKeyToTabMapping = {
  ui: "appearance",
  general: "general",
  ai: "ai",
  spotlight: "spotlight",
} as const

const getSettingUpdated = (payload: Record<string, unknown>) =>
  typeof payload.updated === "number" ? payload.updated : undefined

const getLocalUpdated = (payload: object) =>
  typeof (payload as { updated?: unknown }).updated === "number"
    ? (payload as { updated: number }).updated
    : undefined

const getLocalAppearancePayload = () =>
  pickSyncPayload(localSettingGetterMap.appearance(), settingWhiteListMap.appearance)

const getLocalSpotlightSnapshot = () =>
  localSettingGetterMap.spotlight() as SpotlightSettings & { updated?: number }

const payloadForRemote = (
  domain: SettingDomain,
  payload: Record<string, unknown>,
): Record<string, unknown> =>
  domain === "spotlight"
    ? toAppearanceSpotlightPayload(
        payload as unknown as SpotlightSettings,
        getSettingUpdated(payload),
      )
    : pickSyncPayload(payload, settingWhiteListMap[domain])

const buildFullLocalAppearancePayload = () => {
  const spotlightSettings = getLocalSpotlightSnapshot()
  return mergeAppearancePayloadWithSpotlightSettings(
    getLocalAppearancePayload(),
    spotlightSettings,
    getSettingUpdated(spotlightSettings as unknown as Record<string, unknown>),
  )
}

const mergeAppearancePayloadWithLocalChanges = (
  basePayload: Record<string, unknown>,
  options: {
    appearancePayload?: Record<string, unknown>
    spotlightSettings?: (SpotlightSettings & { updated?: number }) | null
  },
) => {
  let nextPayload = { ...basePayload }

  if (options.appearancePayload) {
    nextPayload = {
      ...nextPayload,
      ...options.appearancePayload,
    }
  }

  if (options.spotlightSettings) {
    nextPayload = mergeAppearancePayloadWithSpotlightSettings(
      nextPayload,
      options.spotlightSettings,
      getSettingUpdated(options.spotlightSettings as unknown as Record<string, unknown>),
    )
  }

  return nextPayload
}

const getLocalPayloadForRemoteTab = (remoteTab: Exclude<RemoteSettingsTab, "appearance">) =>
  payloadForRemote(
    remoteTab,
    localSettingGetterMap[remoteTab]() as unknown as Record<string, unknown>,
  )

const payloadFromRemote = (
  domain: SettingDomain,
  payload: Record<string, unknown>,
  updated: number,
): Record<string, unknown> | null => {
  if (domain === "spotlight") {
    return pickSpotlightPayloadFromRemoteAppearance(payload, updated)
  }

  const nextPayload = pickSyncPayload(payload, settingWhiteListMap[domain])
  if (isEmptyObject(nextPayload)) {
    return null
  }

  return {
    ...nextPayload,
    updated,
  }
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

export type SettingSyncTab = SettingDomain
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

  private pendingPromise: Promise<{
    code: 0
    settings: Record<string, any>
    updated: Record<string, string>
  }> | null = null

  private fetchSettingRemote() {
    if (this.pendingPromise) {
      return this.pendingPromise
    }

    const promise = settings.get().prefetch() as Promise<{
      code: 0
      settings: Record<string, any>
      updated: Record<string, string>
    }>

    this.pendingPromise = promise.finally(() => {
      this.pendingPromise = null
    })

    return this.pendingPromise
  }

  private async fetchRemoteAppearancePayload() {
    const remoteSettings = await this.fetchSettingRemote()
    const remoteAppearancePayload = remoteSettings.settings?.appearance

    return remoteAppearancePayload && typeof remoteAppearancePayload === "object"
      ? { ...(remoteAppearancePayload as Record<string, unknown>) }
      : {}
  }

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

    const changedDomainsByRemoteTab = {} as Partial<Record<RemoteSettingsTab, Set<SettingDomain>>>
    const domainOverrides = {} as Partial<Record<SettingDomain, Record<string, unknown>>>
    const referenceMap = {} as Partial<Record<RemoteSettingsTab, Set<SettingSyncQueueItem>>>
    for (const item of this.queue) {
      const remoteTab = remoteTabMap[item.tab]
      changedDomainsByRemoteTab[remoteTab] ||= new Set()
      changedDomainsByRemoteTab[remoteTab].add(item.tab)

      referenceMap[remoteTab] ||= new Set()
      referenceMap[remoteTab].add(item)

      domainOverrides[item.tab] = {
        ...domainOverrides[item.tab],
        ...payloadForRemote(item.tab, item.payload as unknown as Record<string, unknown>),
      }
    }

    let remoteAppearancePayload = {} as Record<string, unknown>
    if (changedDomainsByRemoteTab.appearance?.size) {
      try {
        remoteAppearancePayload = await this.fetchRemoteAppearancePayload()
      } catch (error) {
        if (isUnauthorizedError(error)) {
          this.queue = []
          this.ownerUserId = currentUserId
          return
        }

        this.reportSyncError("flush", error)
        return
      }
    }

    const promises = [] as Promise<any>[]
    for (const tab in changedDomainsByRemoteTab) {
      const remoteTab = tab as RemoteSettingsTab
      const changedDomains = changedDomainsByRemoteTab[remoteTab]
      const json =
        remoteTab === "appearance"
          ? mergeAppearancePayloadWithLocalChanges(remoteAppearancePayload, {
              appearancePayload: changedDomains?.has("appearance")
                ? domainOverrides.appearance
                : undefined,
              spotlightSettings: changedDomains?.has("spotlight")
                ? getLocalSpotlightSnapshot()
                : undefined,
            })
          : domainOverrides[remoteTab]

      if (!json || isEmptyObject(json)) {
        continue
      }

      const promise = followClient.api.settings
        .update({
          tab: remoteTab as SettingsTab,
          ...json,
        })
        .then(() => {
          // remove from queue
          for (const item of referenceMap[remoteTab] ?? []) {
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
      const promises = [
        followClient.api.settings.update({
          tab: "appearance",
          ...buildFullLocalAppearancePayload(),
        }),
        followClient.api.settings.update({
          tab: "general",
          ...getLocalPayloadForRemoteTab("general"),
        }),
        followClient.api.settings.update({
          tab: "ai",
          ...getLocalPayloadForRemoteTab("ai"),
        }),
      ]

      this.chain = this.chain.finally(() => Promise.all(promises))
      return this.chain
    } else {
      this.chain = this.chain.finally(async () => {
        const remoteTab = remoteTabMap[tab]
        const payload =
          remoteTab === "appearance"
            ? mergeAppearancePayloadWithLocalChanges(await this.fetchRemoteAppearancePayload(), {
                appearancePayload: tab === "appearance" ? getLocalAppearancePayload() : undefined,
                spotlightSettings: tab === "spotlight" ? getLocalSpotlightSnapshot() : undefined,
              })
            : getLocalPayloadForRemoteTab(remoteTab)

        return followClient.api.settings.update({
          tab: remoteTab as SettingsTab,
          ...payload,
        })
      })

      return this.chain
    }
  }

  async syncLocal() {
    const currentUserId = this.getCurrentUserId()
    if (!currentUserId) return

    this.bindQueueOwner(currentUserId)

    const remoteSettings = await this.fetchSettingRemote().catch((error) => {
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
      const remoteTab = tab as RemoteSettingsTab
      const remoteSettingPayload = remoteSettings.settings[remoteTab]
      const updated = remoteSettings.updated[remoteTab]

      if (!updated) {
        continue
      }

      const remoteUpdatedDate = new Date(updated).getTime()

      for (const domain of remoteTabToDomainMap[remoteTab] ?? []) {
        const localSettings = localSettingGetterMap[domain]()
        const localSettingsUpdated = getLocalUpdated(localSettings)

        if (localSettingsUpdated && remoteUpdatedDate <= localSettingsUpdated) {
          continue
        }

        const nextPayload = payloadFromRemote(domain, remoteSettingPayload, remoteUpdatedDate)
        if (!nextPayload || isEmptyObject(nextPayload)) {
          continue
        }

        const setter = localSettingSetterMap[domain]
        setter(nextPayload)
      }
    }
  }
}

export const settingSyncQueue = new SettingSyncQueue()
