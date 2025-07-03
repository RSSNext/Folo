import { jotaiStore } from "@follow/utils"
import { useAtomValue } from "jotai"

import { mouseAtom } from "../atoms/mouse"

export const useMousePosition = () => {
  return useAtomValue(mouseAtom)
}

export const getMousePosition = () => jotaiStore.get(mouseAtom)
