import { createAtomHooks } from "@follow/utils"
import type { DiscoveryItem } from "@follow-app/client-sdk"
import { atom, useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import { useMemo } from "react"

const internalAtom = atom<Record<string, DiscoveryItem[]>>({})
export const [, , useDiscoverSearchData, , getDiscoverSearchData, setDiscoverSearchData] =
  createAtomHooks(internalAtom)

export const useHasDiscoverSearchData = () => {
  return useAtomValue(
    useMemo(() => selectAtom(internalAtom, (data) => Object.keys(data).length > 0), []),
  )
}
