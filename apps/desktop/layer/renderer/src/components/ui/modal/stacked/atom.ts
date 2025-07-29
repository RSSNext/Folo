import { atom } from "jotai"

import type { ModalProps } from "./types"

export const modalStackAtom = atom([] as (ModalProps & { id: string })[])
