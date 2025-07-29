import { getStorageNS } from "@follow/utils/ns"
import { parseSafeUrl } from "@follow/utils/utils"
import { noop } from "foxact/noop"
import { atomWithStorage, createJSONStorage } from "jotai/utils"
import type { SyncStorage } from "jotai/vanilla/utils/atomWithStorage"

import { getRouteParams } from "~/hooks/biz/useRouteParams"
import { createAtomHooks } from "~/lib/jotai"

type PlayerAtomValue = {
  show: boolean
  type?: "audio"
  entryId?: string
  src?: string
  status?: "playing" | "paused" | "loading"
  duration?: number
  currentTime?: number
  isMute?: boolean
  volume?: number
  playbackRate?: number
  /** the listId from the route to indicate that the audio is triggered from a list */
  listId?: string
}

const playerInitialValue: PlayerAtomValue = {
  show: false,
  volume: 0.8,
  duration: 0,
  playbackRate: 1,
}

const jsonStorage = createJSONStorage<PlayerAtomValue>()
let hydrationDone = false
const patchedLocalStorage: SyncStorage<PlayerAtomValue> = {
  setItem: jsonStorage.setItem,
  getItem: (key, initialValue) => {
    const value = jsonStorage.getItem(key, initialValue)
    if (value && !hydrationDone) {
      // patch status to `paused` when hydration
      value.status = "paused"
      hydrationDone = true
    }
    return value
  },
  removeItem: jsonStorage.removeItem,
}
export const [
  ,
  ,
  useAudioPlayerAtomValue,
  useAudioSetPlayerAtom,
  getAudioPlayerAtomValue,
  setAudioPlayerAtomValue,
  useAudioPlayerAtomSelector,
] = createAtomHooks<PlayerAtomValue>(
  atomWithStorage(getStorageNS("player"), playerInitialValue, patchedLocalStorage, {
    getOnInit: true,
  }),
)

export const AudioPlayer = {
  audio: new Audio(),
  currentTimeTimer: null as ReturnType<typeof setInterval> | null,

  __currentActionId: 0,
  get() {
    return getAudioPlayerAtomValue()
  },
  mount(v: Omit<PlayerAtomValue, "show" | "status" | "playedSeconds" | "duration">) {
    const curV = getAudioPlayerAtomValue()
    if (!v.src || (curV.src === v.src && curV.status === "playing")) {
      return
    }

    const routeParams = getRouteParams()

    setAudioPlayerAtomValue({
      ...curV,
      ...v,
      status: "loading",
      show: true,
      listId: routeParams.listId,
    })
    const currentUrl = parseSafeUrl(this.audio.src)?.toString() ?? this.audio.src
    const newUrl = parseSafeUrl(v.src)?.toString() ?? v.src

    // It seems that audio load from local file has some limitations, i think reset the audio should be fine here
    if (currentUrl !== newUrl || newUrl.startsWith("file://")) {
      this.audio.src = v.src
      this.audio.currentTime = v.currentTime ?? curV.currentTime ?? 0
    }
    this.audio.volume = curV.volume ?? 0.8
    this.audio.playbackRate = curV.playbackRate ?? 1

    this.currentTimeTimer && clearInterval(this.currentTimeTimer)
    this.currentTimeTimer = setInterval(() => {
      setAudioPlayerAtomValue({
        ...getAudioPlayerAtomValue(),
        currentTime: this.audio.currentTime,
      })
    }, 1000)

    this.audio.onloadedmetadata = () => {
      if (Number.isNaN(this.audio.duration) || this.audio.duration === Infinity) {
        this.audio.currentTime = 0
      }
    }

    const currentActionId = this.__currentActionId
    return this.audio
      .play()
      .then(() => {
        if (currentActionId !== this.__currentActionId) return
        setAudioPlayerAtomValue({
          ...getAudioPlayerAtomValue(),
          status: "playing",
          duration: this.audio.duration === Infinity ? 0 : this.audio.duration,
        })
      })
      .catch(noop)
  },
  teardown() {
    this.currentTimeTimer && clearInterval(this.currentTimeTimer)
    this.audio.pause()
  },
  play() {
    ++this.__currentActionId
    const curV = getAudioPlayerAtomValue()

    this.mount(curV)
  },
  pause() {
    ++this.__currentActionId
    const curV = getAudioPlayerAtomValue()
    if (curV.status === "paused") {
      return
    }

    setAudioPlayerAtomValue({
      ...curV,
      status: "paused",
      currentTime: this.audio.currentTime,
    })
    this.teardown()
    return
  },
  togglePlayAndPause() {
    const curV = getAudioPlayerAtomValue()
    if (curV.status === "playing") {
      return this.pause()
    } else if (curV.status === "paused") {
      return this.mount(curV)
    } else {
      return this.pause()
    }
  },
  close() {
    setAudioPlayerAtomValue({
      ...getAudioPlayerAtomValue(),
      show: false,
      status: "paused",
    })

    this.teardown()
  },
  seek(time: number) {
    this.audio.currentTime = time
    setAudioPlayerAtomValue({
      ...getAudioPlayerAtomValue(),
      currentTime: time,
    })
  },
  setPlaybackRate(speed: number) {
    this.audio.playbackRate = speed
    setAudioPlayerAtomValue({
      ...getAudioPlayerAtomValue(),
      playbackRate: speed,
    })
  },
  back(time: number) {
    this.seek(Math.max(this.audio.currentTime - time, 0))
  },
  forward(time: number) {
    this.seek(Math.min(this.audio.currentTime + time, this.audio.duration))
  },
  toggleMute() {
    this.audio.muted = !this.audio.muted
    setAudioPlayerAtomValue({
      ...getAudioPlayerAtomValue(),
      isMute: this.audio.muted,
    })
  },
  setVolume(volume: number) {
    this.audio.volume = volume
    setAudioPlayerAtomValue({
      ...getAudioPlayerAtomValue(),
      volume,
    })
  },
}
