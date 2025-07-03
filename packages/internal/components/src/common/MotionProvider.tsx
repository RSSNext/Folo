import { domMax, LazyMotion, MotionConfig } from "motion/react"

export const MotionProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <LazyMotion features={domMax} strict key="framer">
      <MotionConfig
        transition={{
          type: "tween",
          duration: 0.15,
          ease: "easeInOut",
        }}
      >
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}
