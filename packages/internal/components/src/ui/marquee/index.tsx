import type { PropsWithChildren } from "react"
import { useCallback, useRef, useState } from "react"
import type { MarqueeProps } from "react-fast-marquee"
import Marquee from "react-fast-marquee"

export const TitleMarquee = ({
  children,
  speed = 30,
  play,
  className,
  ...rest
}: PropsWithChildren &
  MarqueeProps & {
    className?: string
  }) => {
  const [hovered, setHovered] = useState(false)
  const [pause, setPause] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const $wrapper = useRef<HTMLDivElement>(null)
  return (
    <div
      className={className}
      ref={$wrapper}
      // className="[&_*]:scrollbar-none"
      onMouseEnter={useCallback(() => {
        const $container = ref.current

        if (!$container) return

        const $child = $container.querySelector(".rfm-child")
        if (!$child) return

        const canScroll = $child.clientWidth > $container.clientWidth

        if (!canScroll) return

        setHovered(true)
      }, [])}
      onMouseLeave={useCallback(() => {
        setHovered(false)

        const $container = ref.current
        if (!$container) return
        const marqueeContainer = $container
        const marqueeChildren = Array.from(marqueeContainer.children) as HTMLElement[]

        // Force a reflow on marquee child nodes to reset animation
        marqueeChildren.forEach((marquee: HTMLElement) => {
          marquee.style.animation = "none"
          void marquee.offsetHeight
          marquee.style.animation = ""
        })
      }, [])}
    >
      <Marquee
        className="overflow-hidden"
        play={hovered && !pause}
        ref={ref}
        speed={speed}
        gradient={false}
        {...rest}
        onCycleComplete={useCallback(() => {
          setPause(true)
          setTimeout(() => setPause(false), 1000)
        }, [])}
      >
        {children}
        {"\u00A0\u00A0\u00A0\u00A0"}
      </Marquee>
    </div>
  )
}
