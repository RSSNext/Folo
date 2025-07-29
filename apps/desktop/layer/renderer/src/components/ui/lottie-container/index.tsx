import { RootPortal } from "@follow/components/ui/portal/index.jsx"
import type { DotLottie } from "@lottiefiles/dotlottie-react"
import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import { atom, useAtomValue } from "jotai"
import type { FC, ReactNode, RefCallback } from "react"
import { useEffect, useState } from "react"

import { jotaiStore } from "~/lib/jotai"

const portalElementsAtom = atom([] as ReactNode[])

export function LottieRenderContainer() {
  const elements = useAtomValue(portalElementsAtom, { store: jotaiStore })

  return (
    <RootPortal>
      <div className="pointer-events-none fixed z-[9999]" data-testid="lottie-render-container">
        {elements.map((element) => element)}
      </div>
    </RootPortal>
  )
}

type LottieOptions = {
  once?: boolean

  x: number
  y: number

  height?: number
  width?: number
  className?: string

  onComplete?: () => void

  speed?: number
}
export const mountLottie = (url: string, options: LottieOptions) => {
  const { once = true, height, width, x, y, className, speed } = options

  const Lottie: FC = () => {
    const [dotLottie, setDotLottie] = useState<DotLottie | null>(null)

    useEffect(() => {
      function onComplete() {
        if (once) {
          unmount()
        }

        options.onComplete?.()
      }

      if (dotLottie) {
        dotLottie.addEventListener("complete", onComplete)
      }

      return () => {
        if (dotLottie) {
          dotLottie.removeEventListener("complete", onComplete)
        }
      }
    }, [dotLottie])

    const dotLottieRefCallback: RefCallback<DotLottie> = (dotLottie) => {
      setDotLottie(dotLottie)
    }

    return (
      <DotLottieReact
        speed={speed}
        dotLottieRefCallback={dotLottieRefCallback}
        src={url}
        autoplay
        loop={false}
        height={height}
        width={width}
        style={{
          height,
          width,
          position: "fixed",

          left: 0,
          top: 0,
          transform: `translate(${x}px, ${y}px)`,
        }}
        className={className}
      />
    )
  }

  const element = <Lottie />
  const unmount = () => {
    jotaiStore.set(portalElementsAtom, (prev) => prev.filter((e) => e !== element))
  }

  jotaiStore.set(portalElementsAtom, (prev) => [...prev, element])
  return unmount
}
