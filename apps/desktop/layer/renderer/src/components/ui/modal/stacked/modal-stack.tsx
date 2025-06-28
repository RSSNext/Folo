import { useAtomValue } from "jotai"
import { AnimatePresence } from "motion/react"

import { useModalStackCalculationAndEffect } from "../helper/useModalStackCalculationAndEffect"
import { modalStackAtom } from "./atom"
import { useModalStack } from "./hooks"
import { ModalInternal } from "./modal"

export const ModalStack = () => {
  const { present } = useModalStack()
  window.presentModal = present

  const stack = useAtomValue(modalStackAtom)

  const { topModalIndex, overlayOptions } = useModalStackCalculationAndEffect()

  return (
    <AnimatePresence mode="popLayout">
      {stack.map((item, index) => (
        <ModalInternal
          key={item.id}
          item={item}
          index={index}
          isTop={index === topModalIndex}
          isBottom={index === 0}
          overlayOptions={overlayOptions}
        />
      ))}
    </AnimatePresence>
  )
}
