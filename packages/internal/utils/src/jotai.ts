import type { Atom, PrimitiveAtom } from "jotai"
import { createStore, useAtom, useAtomValue, useSetAtom } from "jotai"
import { selectAtom } from "jotai/utils"
import { useCallback } from "react"
import { shallow } from "zustand/shallow"

export const jotaiStore = createStore()

export const createAtomAccessor = <T>(atom: PrimitiveAtom<T>) =>
  [
    () => jotaiStore.get(atom),
    (value: T | ((prev: T) => T)) => jotaiStore.set(atom, value),
  ] as const

const options = { store: jotaiStore }
/**
 * @param atom - jotai
 * @returns - [atom, useAtom, useAtomValue, useSetAtom, jotaiStore.get, jotaiStore.set, useSelector]
 */
export const createAtomHooks = <T>(atom: PrimitiveAtom<T>) => {
  let _atomSelector: ReturnType<typeof createAtomSelector<T>> | undefined

  const result = [
    atom,
    () => useAtom(atom, options),
    () => useAtomValue(atom, options),
    () => useSetAtom(atom, options),
    ...createAtomAccessor(atom),
  ] as const

  type Result = [...typeof result, ReturnType<typeof createAtomSelector<T>>]

  Object.defineProperty(result, result.length, {
    get() {
      if (!_atomSelector) {
        _atomSelector = createAtomSelector(atom)
      }
      return _atomSelector
    },
  })

  return result as any as Result
}

const noop: any[] = []
const createAtomSelector = <T>(atom: Atom<T>) => {
  const useHook = <R>(selector: (a: T) => R, deps: any[] = noop) =>
    useAtomValue(
      selectAtom(
        atom,
        useCallback((a) => selector(a as T), deps),
        shallow,
      ),
    )

  return useHook
}
