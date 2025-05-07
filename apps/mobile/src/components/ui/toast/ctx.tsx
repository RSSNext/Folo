import type { PrimitiveAtom } from "jotai"
import { createContext } from "react"

import type { ToastProps, ToastRef } from "./types"

export const ToastContainerContext = createContext<PrimitiveAtom<ToastProps[]>>(null!)

type Disposer = () => void
interface ToastActionContext {
  register: (currentIndex: number, ref: ToastRef) => Disposer
}

export const ToastActionContext = createContext<ToastActionContext>(null!)
