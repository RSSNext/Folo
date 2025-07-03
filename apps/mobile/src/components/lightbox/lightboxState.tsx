import { nanoid } from "nanoid/non-secure"
import type { PropsWithChildren } from "react"
import { createContext, use, useCallback, useMemo, useState } from "react"

import type { ImageSource } from "./ImageViewing/@types"

export type Lightbox = {
  id: string
  images: ImageSource[]
  index: number
}

const LightboxContext = createContext<{
  activeLightbox: Lightbox | null
}>({
  activeLightbox: null,
})

const LightboxControlContext = createContext<{
  openLightbox: (lightbox: Omit<Lightbox, "id">) => void
  closeLightbox: () => boolean
}>({
  openLightbox: () => {
    console.error("LightboxControlContext: openLightbox called without provider")
  },
  closeLightbox: () => {
    console.error("LightboxControlContext: closeLightbox called without provider")
    return false
  },
})

export function LightboxStateProvider({ children }: PropsWithChildren) {
  const [activeLightbox, setActiveLightbox] = useState<Lightbox | null>(null)

  const openLightbox = useCallback((lightbox: Omit<Lightbox, "id">) => {
    setActiveLightbox((prevLightbox) => {
      if (prevLightbox) {
        // Ignore duplicate open requests. If it's already open,
        // the user has to explicitly close the previous one first.
        return prevLightbox
      } else {
        return { ...lightbox, id: nanoid() }
      }
    })
  }, [])

  const closeLightbox = useCallback(() => {
    const wasActive = !!activeLightbox
    setActiveLightbox(null)
    return wasActive
  }, [activeLightbox])

  const state = useMemo(
    () => ({
      activeLightbox,
    }),
    [activeLightbox],
  )

  const methods = useMemo(
    () => ({
      openLightbox,
      closeLightbox,
    }),
    [openLightbox, closeLightbox],
  )

  return (
    <LightboxContext value={state}>
      <LightboxControlContext value={methods}>{children}</LightboxControlContext>
    </LightboxContext>
  )
}

export function useLightbox() {
  return use(LightboxContext)
}

export function useLightboxControls() {
  return use(LightboxControlContext)
}
