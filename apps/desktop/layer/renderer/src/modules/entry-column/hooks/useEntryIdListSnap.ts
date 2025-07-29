import { atom, useAtomValue, useSetAtom } from "jotai"
import { useEffect, useMemo, useState } from "react"

/**
 * This is a global atom to store the current entry column's entry id list snapshot.
 * It used to get current entry id list(keep sorted) in other components.
 */
const globalEntryIdListSnapAtom = atom<string[]>([])
export const useSnapEntryIdList = (ids: string[]) => {
  const set = useSetAtom(globalEntryIdListSnapAtom)
  useEffect(() => {
    set(ids)
  }, [ids, set])
}

export const useGetEntryIdInRange = (id: string, range: [number, number]) => {
  const snap = useAtomValue(globalEntryIdListSnapAtom)
  const [stableRange] = useState(range)
  return useMemo(() => {
    const index = snap.indexOf(id)

    return snap.slice(
      Math.max(0, index - stableRange[0]),
      Math.min(snap.length, index + stableRange[1]),
    )
  }, [id, snap, stableRange])
}
