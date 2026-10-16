import { atom, useAtomValueRawSync } from "jotai"

import { createAtomHooks, jotaiStore } from "~/lib/jotai"

export const [, , useMainContainerElement, , getMainContainerElement, setMainContainerElement] =
  createAtomHooks(atom<HTMLElement | null>(null))

const rootContainerElementAtom = atom<HTMLElement | null>(null)
export const [, , , , getRootContainerElement, setRootContainerElement] =
  createAtomHooks(rootContainerElementAtom)

// Set by the root container's ref callback in the commit that mounts its readers, before they
// subscribe. Jotai v3 `useAtomValue` would keep `null`; `useAtomValueRawSync` re-checks after
// subscribing.
export const useRootContainerElement = () =>
  useAtomValueRawSync(rootContainerElementAtom, { store: jotaiStore })
