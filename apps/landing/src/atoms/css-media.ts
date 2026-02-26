import { createAtomHooks } from 'jojoo/react'
import { atom } from 'jotai'

export const [, , useIsPrintMode, , , setIsPrintMode] = createAtomHooks(
  atom(false),
)
