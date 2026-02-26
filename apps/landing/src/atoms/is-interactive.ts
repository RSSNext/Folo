import { atom, useAtomValue } from 'jotai'

import { jotaiStore } from '~/lib/store'

const isInteractiveAtom = atom(false)
export const useIsInteractive = () => useAtomValue(isInteractiveAtom)

export const getIsInteractive = () => jotaiStore.get(isInteractiveAtom)
export const setIsInteractive = (value: boolean) =>
  jotaiStore.set(isInteractiveAtom, value)
