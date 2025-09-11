import { getStorageNS } from "@follow/utils/ns"
import { atomWithStorage } from "jotai/utils"

import { createAtomHooks } from "~/lib/jotai"

const TUTORIAL_STORAGE_KEY = getStorageNS("scroll-to-exit-tutorial-seen")

// Create atom with storage for tutorial seen state
const scrollToExitTutorialSeenAtom = atomWithStorage<boolean>(TUTORIAL_STORAGE_KEY, false)

// Create hooks for the atom
export const [
  ,
  ,
  useScrollToExitTutorialSeen,
  ,
  getScrollToExitTutorialSeen,
  setScrollToExitTutorialSeen,
] = createAtomHooks(scrollToExitTutorialSeenAtom)
