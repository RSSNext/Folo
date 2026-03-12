'use client'

import { useAtomValue } from 'jotai'
import { AnimatePresence, useDragControls } from 'motion/react'
import type { PointerEventHandler } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useEventCallback } from 'usehooks-ts'

import { Dialog, DialogContent } from '~/components/ui/dialog'
import { cn } from '~/lib/cn'
import { Spring } from '~/lib/spring'
import { jotaiStore } from '~/lib/store'

import { ModalContext } from './hooks'
import type { ModalItem } from './ModalManager'
import { Modal, modalItemsAtom } from './ModalManager'
import type { ModalComponent } from './types'

export const ModalContainer = () => {
  const items = useAtomValue(modalItemsAtom)

  return (
    <div id="global-modal-container">
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <ModalWrapper key={item.id} item={item} />
        ))}
      </AnimatePresence>
    </div>
  )
}

const ModalWrapper = ({ item }: { item: ModalItem }) => {
  const [open, setOpen] = useState(true)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Modal.__registerCloser(item.id, () => setOpen(false))
    return () => {
      Modal.__unregisterCloser(item.id)
    }
  }, [item.id])

  const dismiss = useMemo(
    () => () => {
      setOpen(false)
    },
    [],
  )

  const handleOpenChange = (o: boolean) => {
    setOpen(o)
  }

  // After exit animation, remove from store
  const handleAnimationComplete = useEventCallback(() => {
    if (!open) {
      const items = jotaiStore.get(modalItemsAtom)
      jotaiStore.set(
        modalItemsAtom,
        items.filter((m) => m.id !== item.id),
      )
    }
  })

  // Calculate dynamic drag constraints based on actual modal size
  const getDragConstraints = useCallback(() => {
    if (!modalRef.current) {
      return {
        left: -window.innerWidth / 2 + 200,
        right: window.innerWidth / 2 - 200,
        top: -window.innerHeight / 2 + 150,
        bottom: window.innerHeight / 2 - 150,
      }
    }

    const modalRect = modalRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const padding = 20

    // Calculate constraints to keep modal within viewport bounds
    const maxLeft = -(viewportWidth / 2 - modalRect.width / 2 - padding)
    const maxRight = viewportWidth / 2 - modalRect.width / 2 - padding
    const maxTop = -(viewportHeight / 2 - modalRect.height / 2 - padding)
    const maxBottom = viewportHeight / 2 - modalRect.height / 2 - padding

    return {
      left: maxLeft,
      right: maxRight,
      top: maxTop,
      bottom: maxBottom,
    }
  }, [])

  // Handle drag start to update constraints
  const handleDragStart = useCallback(() => {
    // Update constraints when drag starts to ensure they're based on current modal size
    if (modalRef.current) {
      return getDragConstraints()
    }
  }, [getDragConstraints])

  const Component = item.component as ModalComponent<any>

  const {
    contentProps,
    contentClassName,
    showCloseButton,
    disableDrag,
    disableOverlayClickToClose,
    disableTransition,
  } = Component

  const contextValue = useMemo(() => ({ dismiss }), [dismiss])
  const dragControls = useDragControls()

  const handleDrag: PointerEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      dragControls.start(e)
    },
    [dragControls],
  )
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        ref={modalRef}
        onInteractOutside={(e) => {
          if (disableOverlayClickToClose) e.preventDefault()
        }}
        dragElastic={0}
        dragListener={false}
        dragMomentum={false}
        className={cn('w-full max-w-md', contentClassName)}
        transition={Spring.smooth(0.2, 0.1)}
        onAnimationComplete={handleAnimationComplete}
        drag={!disableDrag}
        dragControls={dragControls}
        dragConstraints={getDragConstraints()}
        onDragStart={handleDragStart}
        showCloseButton={showCloseButton}
        disableOverlayClickToClose={disableOverlayClickToClose}
        disableTransition={disableTransition}
        {...contentProps}
        {...item.modalContent}
      >
        <ModalContext value={contextValue}>
          <div
            className="absolute inset-x-0 top-0 h-6"
            onPointerDownCapture={handleDrag}
          />
          <Component
            modalId={item.id}
            dismiss={dismiss}
            {...(item.props as any)}
          />
        </ModalContext>
      </DialogContent>
    </Dialog>
  )
}
