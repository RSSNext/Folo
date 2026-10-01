import type { GeneralSettings, UISettings } from "@follow/shared/settings/interface"
import type { SpotlightSettings } from "@follow/shared/spotlight"
import {
  mergeAppearancePayloadWithSpotlightSettings,
  pickSpotlightPayloadFromRemoteAppearance,
  toAppearanceSpotlightPayload,
} from "@follow/shared/spotlight"
import { registerSyncModel } from "@follow/store/sync/model-registry"
import type { SyncAction } from "@follow/store/sync/types"
import { whoami } from "@follow/store/user/getters"
import { tracker } from "@follow/tracker"
import { isEmptyObject, jotaiStore, sleep } from "@follow/utils"
import { EventBus } from "@follow/utils/event-bus"
import type { SettingsTab } from "@follow-app/client-sdk"
import { FollowAPIError } from "@follow-app/client-sdk"
import { isEqual } from "es-toolkit"
import type { PrimitiveAtom } from "jotai"

import {
  __generalSettingAtom,
  createDefaultGeneralSettings,
  generalLocalOnlyKeys,
  getGeneralSettings,
} from "@/src/atoms/settings/general"
import {
  __spotlightSettingAtom,
  getSpotlightSettings,
  spotlightServerSyncWhiteListKeys,
} from "@/src/atoms/settings/spotlight"
import {
  __uiSettingAtom,
  createDefaultSettings as createDefaultUISettings,
  getUISettings,
  uiLocalOnlyKeys,
} from "@/src/atoms/settings/ui"
import { followClient } from "@/src/lib/api-client"
import { kv } from "@/src/lib/kv"

type SettingMapping = {
  appearance: UISettings
  general: GeneralSettings
  spotlight: SpotlightSettings
}
type SettingDomain = keyof SettingMapping
type RemoteSettingsTab = "appearance" | "general"

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
  spotlight: createInternalSetter(__spotlightSettingAtom),
}

type LocalOnlyDomain = Exclude<SettingDomain, "spotlight">

/**
 * Appearance and general settings sync every key except their device-local ones. Spotlight
 * rules travel in the appearance tab and sync only their own keys, so the appearance domain
 * leaves those keys to them.
 */
const localOnlyKeysMap: Record<LocalOnlyDomain, readonly string[]> = {
  appearance: [...uiLocalOnlyKeys, "spotlights", "spotlightsUpdated"],
  general: generalLocalOnlyKeys,
}

const defaultSettingsGetterMap: Record<LocalOnlyDomain, () => object> = {
  appearance: createDefaultUISettings,
  general: createDefaultGeneralSettings,
}

const omitLocalOnlyKeys = <T extends object>(domain: LocalOnlyDomain, payload: T) => {
  const localOnlyKeys = new Set(localOnlyKeysMap[domain])
  return Object.fromEntries(
    // The server records when each tab changed, so `updated` stays on the device as well.
    Object.entries(payload).filter(([key]) => key !== "updated" && !localOnlyKeys.has(key)),
  ) as Partial<T>
}

const remoteTabMap: Record<SettingDomain, RemoteSettingsTab> = {
  appearance: "appearance",
  general: "general",
  spotlight: "appearance",
}

const remoteTabToDomainMap: Record<RemoteSettingsTab, SettingDomain[]> = {
  appearance: ["appearance", "spotlight"],
  general: ["general"],
}

const bizSettingKeyToDomainMapping = {
  ui: "appearance",
  general: "general",
  spotlight: "spotlight",
} as const

const getSettingUpdated = (payload: Record<string, unknown>) =>
  typeof payload.updated === "number" ? payload.updated : undefined

const getLocalAppearancePayload = () =>
  omitLocalOnlyKeys("appearance", localSettingGetterMap.appearance())

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
    : omitLocalOnlyKeys(domain, payload)

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

  const nextPayload = omitLocalOnlyKeys(domain, payload)
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

declare module "@follow/utils/event-bus" {
  interface CustomEvent {
    SETTING_CHANGE_EVENT: {
      key: keyof typeof bizSettingKeyToDomainMapping
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

      const domain = bizSettingKeyToDomainMapping[data.key] as SettingSyncTab
      if (!domain) return

      const nextPayload =
        domain === "spotlight"
          ? pickSyncPayload(data.payload, spotlightServerSyncWhiteListKeys)
          : omitLocalOnlyKeys(domain, data.payload)
      if (isEmptyObject(nextPayload)) return
      this.enqueue(domain, nextPayload)

      void this.persist()
    })

    this.disposers.push(d1)

    await loadPromise
    // After the load, which keeps the queue as it is once anything was added to it.
    this.uploadLocalSettingsOnce()
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
  private flushScheduled = false

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
          await this.clearQueueAndPersist(currentUserId)
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
          ? // Preserve remote untouched appearance fields so spotlight-only syncs do not clobber them.
            mergeAppearancePayloadWithLocalChanges(remoteAppearancePayload, {
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
      const groupedPayloads = {} as Partial<Record<RemoteSettingsTab, Record<string, unknown>>>
      groupedPayloads.appearance = buildFullLocalAppearancePayload()
      groupedPayloads.general = getLocalPayloadForRemoteTab("general")

      const promises = Object.entries(groupedPayloads).map(([remoteTab, payload]) =>
        followClient.api.settings.update({
          tab: remoteTab as SettingsTab,
          ...payload,
        }),
      )

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
  /**
   * @param rethrow let a failed request reach the caller. The sync engine needs it: a load
   * that did not happen must not count as done.
   */
  async syncLocal(options?: { rethrow?: boolean }) {
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
      if (options?.rethrow) throw error
      return
    }

    if (!remoteSettings) return
    if (__DEV__) {
      console.log("remote settings:", remoteSettings)
    }

    this.applyRemoteSettings(remoteSettings)
  }

  /**
   * A local change to this tab is still waiting to be sent. It wins for now, and the server's
   * answer to it is logged with both changes merged.
   */
  private hasPendingChange(tab: RemoteSettingsTab) {
    return this.queue.some((item) => remoteTabMap[item.tab] === tab)
  }

  /**
   * From 1.6.0 until this version only the device-local keys synced, so what the server holds
   * for every other setting may be months old. Once per account, before this device takes any
   * of it, the settings changed here from their defaults are queued for upload. While they
   * wait, their tabs keep the server's values out; afterwards the settings still at their
   * defaults take the account's values.
   */
  private uploadLocalSettingsOnce() {
    const currentUserId = this.getCurrentUserId()
    if (!currentUserId) return

    const doneKey = `setting_sync_local_first_${currentUserId}`
    if (kv.getSync(doneKey)) return
    kv.setSync(doneKey, "1")

    let enqueued = false
    for (const domain of Object.keys(defaultSettingsGetterMap) as LocalOnlyDomain[]) {
      const localSettings = localSettingGetterMap[domain]() as unknown as Record<string, unknown>
      const defaultSettings = defaultSettingsGetterMap[domain]() as Record<string, unknown>
      const changedSettings = Object.fromEntries(
        Object.keys(defaultSettings)
          .filter((key) => !isEqual(localSettings[key], defaultSettings[key]))
          .map((key) => [key, localSettings[key]]),
      )
      const payload = omitLocalOnlyKeys(domain, changedSettings)
      if (!isEmptyObject(payload)) {
        void this.enqueue(domain, payload)
        enqueued = true
      }
    }
    if (enqueued) {
      void this.persist()
    }
  }

  /** Merge settings from the server into the local ones; the newer side wins per domain. */
  applyRemoteSettings(remoteSettings: {
    settings: Record<string, any>
    updated: Record<string, string>
  }) {
    this.uploadLocalSettingsOnce()
    if (isEmptyObject(remoteSettings.settings)) return

    for (const tab in remoteSettings.settings) {
      const remoteTab = tab as RemoteSettingsTab
      if (this.hasPendingChange(remoteTab)) continue

      const remoteSettingPayload = remoteSettings.settings[remoteTab as SettingsTab]
      const updated = remoteSettings.updated[remoteTab as SettingsTab]

      if (!updated || !remoteSettingPayload || typeof remoteSettingPayload !== "object") {
        continue
      }

      const remoteUpdatedDate = new Date(updated).getTime()

      for (const settingDomain of remoteTabToDomainMap[remoteTab] ?? []) {
        const nextPayload = payloadFromRemote(
          settingDomain,
          remoteSettingPayload as Record<string, unknown>,
          remoteUpdatedDate,
        )
        if (!nextPayload || isEmptyObject(nextPayload)) {
          continue
        }

        const nextUpdated =
          typeof nextPayload.updated === "number" ? nextPayload.updated : remoteUpdatedDate
        const localSettings = localSettingGetterMap[settingDomain]()
        const localSettingsUpdated =
          "updated" in localSettings && typeof localSettings.updated === "number"
            ? localSettings.updated
            : undefined

        if (localSettingsUpdated && nextUpdated <= localSettingsUpdated) {
          continue
        }

        const setter = localSettingSetterMap[settingDomain]
        setter(nextPayload as Partial<SettingMapping[typeof settingDomain]>)
      }
    }
  }

  /**
   * One settings tab changed on the server, reported by the sync engine's change log. The
   * action carries what `GET /settings` would return for that tab, so it goes through the
   * same last-writer-wins merge as a full sync.
   */
  async applyRemoteChange(action: SyncAction) {
    if (action.action !== "U" || !action.modelId) return
    const tab = action.modelId as RemoteSettingsTab
    // Tabs this app does not sync, such as the desktop AI settings.
    if (!(tab in remoteTabToDomainMap)) return
    const data = action.data as { payload?: Record<string, unknown>; updatedAt?: string } | null
    if (!data?.updatedAt) return

    this.uploadLocalSettingsOnce()
    if (this.hasPendingChange(tab)) return

    if (!data.payload) {
      await this.syncLocal()
      return
    }

    this.applyRemoteSettings({
      settings: { [tab]: data.payload },
      updated: { [tab]: data.updatedAt },
    })
  }
}

export const settingSyncQueue = new SettingSyncQueue()

// Registered at module load, before the sync engine starts: once the settings were loaded in
// full, launches no longer request them and other devices' changes arrive through the log.
registerSyncModel("setting", {
  bootstrap: () => settingSyncQueue.syncLocal({ rethrow: true }),
  apply: (action) => settingSyncQueue.applyRemoteChange(action),
})
