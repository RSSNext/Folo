'use client'

import { atom } from 'jotai'

import { jotaiStore } from '~/lib/store'

import type { ModalComponent, ModalContentConfig, ModalItem } from './types'

export const modalItemsAtom = atom<ModalItem[]>([])

const modalCloseRegistry = new Map<string, () => void>()

export const Modal = {
  present<P = unknown>(
    Component: ModalComponent<P>,
    props?: P,
    modalContent?: ModalContentConfig,
  ): string {
    const items = jotaiStore.get(modalItemsAtom)

    // Enforce single instance per ModalComponent. If an instance exists,
    // move it to the top and update its props/content, returning its id.
    const existingIndex = items.findIndex(
      (m) => m.component === (Component as ModalComponent<any>),
    )
    if (existingIndex !== -1) {
      const existing = items[existingIndex]
      const updated = {
        ...existing,
        // Update props/content when re-invoked
        props: (props as any) ?? existing.props,
        modalContent: modalContent ?? existing.modalContent,
      }

      const next = items.filter((_, i) => i !== existingIndex)
      next.push(updated)
      jotaiStore.set(modalItemsAtom, next)
      return existing.id
    }

    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    jotaiStore.set(modalItemsAtom, [
      ...items,
      { id, component: Component as ModalComponent<any>, props, modalContent },
    ])
    return id
  },

  dismiss(id: string): void {
    const closer = modalCloseRegistry.get(id)
    if (closer) {
      closer()
      return
    }
    // Fallback: remove immediately if closer not registered yet
    const items = jotaiStore.get(modalItemsAtom)
    jotaiStore.set(
      modalItemsAtom,
      items.filter((m) => m.id !== id),
    )
  },

  /** Internal: used by container to manage close hooks */
  __registerCloser(id: string, fn: () => void) {
    modalCloseRegistry.set(id, fn)
  },
  __unregisterCloser(id: string) {
    modalCloseRegistry.delete(id)
  },
}

export { type ModalItem } from './types'
