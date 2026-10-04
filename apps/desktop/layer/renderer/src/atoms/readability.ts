import { atom, useAtomValueRawSync } from "jotai"
import { selectAtom } from "jotai/utils"
import { useMemo } from "react"

import { createAtomHooks, jotaiStore } from "~/lib/jotai"

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
const readabilityStatusAtom = atom<Record<string, ReadabilityStatus>>({})
export const [, , , , getReadabilityStatus, __setReadabilityStatus] =
  createAtomHooks(readabilityStatusAtom)
export const setReadabilityStatus = mergeObjectSetter(__setReadabilityStatus, getReadabilityStatus)

// The auto readability entry action sets the status in a passive effect of the commit that mounts
// the entry content, before the readers of that commit subscribe. Jotai v3 `useAtomValue` keeps the
// value they rendered; `useAtomValueRawSync` (useSyncExternalStore) re-checks after subscribing.
const useEntryReadabilityStatusSelector = <T>(
  entryId: string | undefined,
  select: (status: ReadabilityStatus | undefined) => T,
) =>
  useAtomValueRawSync(
    useMemo(
      () => selectAtom(readabilityStatusAtom, (map) => select(entryId ? map[entryId] : undefined)),
      [entryId, select],
    ),
    { store: jotaiStore },
  )

const selectIsInReadability = (status: ReadabilityStatus | undefined) =>
  status ? isInReadability(status) : false
const selectIsReadabilitySuccess = (status: ReadabilityStatus | undefined) =>
  status === ReadabilityStatus.SUCCESS
const selectReadabilityStatus = (status: ReadabilityStatus | undefined) =>
  status || ReadabilityStatus.INITIAL

export const useEntryIsInReadability = (entryId?: string) =>
  useEntryReadabilityStatusSelector(entryId, selectIsInReadability)

export const useEntryIsInReadabilitySuccess = (entryId?: string) =>
  useEntryReadabilityStatusSelector(entryId, selectIsReadabilitySuccess)

export const useEntryInReadabilityStatus = (entryId?: string) =>
  useEntryReadabilityStatusSelector(entryId, selectReadabilityStatus)

export const isInReadability = (status: ReadabilityStatus) =>
  status !== ReadabilityStatus.INITIAL && !!status
