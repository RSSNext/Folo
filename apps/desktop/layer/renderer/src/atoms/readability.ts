import { atom } from "jotai"

import { createAtomHooks } from "~/lib/jotai"

const mergeObjectSetter =
  <T>(setter: (prev: T) => void, getter: () => T) =>
  (value: Partial<T>) =>
    setter({ ...getter(), ...value })

export enum ReadabilityStatus {
  INITIAL = 1,
  WAITING = 2,
  SUCCESS = 3,
  FAILURE = 4,
}
export const [
  ,
  ,
  useReadabilityStatus,
  ,
  getReadabilityStatus,
  __setReadabilityStatus,
  useReadabilityStatusSelector,
] = createAtomHooks(atom<Record<string, ReadabilityStatus>>({}))
export const setReadabilityStatus = mergeObjectSetter(__setReadabilityStatus, getReadabilityStatus)

export const useEntryIsInReadability = (entryId?: string) =>
  useReadabilityStatusSelector(
    (map) => (entryId ? (map[entryId] ? isInReadability(map[entryId]) : false) : false),
    [entryId],
  )

export const useEntryIsInReadabilitySuccess = (entryId?: string) =>
  useReadabilityStatusSelector(
    (map) => (entryId ? map[entryId] === ReadabilityStatus.SUCCESS : false),
    [entryId],
  )

export const useEntryInReadabilityStatus = (entryId?: string) =>
  useReadabilityStatusSelector(
    (map) => (entryId ? map[entryId] || ReadabilityStatus.INITIAL : ReadabilityStatus.INITIAL),
    [entryId],
  )

export const isInReadability = (status: ReadabilityStatus) =>
  status !== ReadabilityStatus.INITIAL && !!status
