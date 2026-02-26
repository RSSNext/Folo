'use client'

import type { HTMLMotionProps, Transition } from 'motion/react'
import { AnimatePresence, m as motion } from 'motion/react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import * as React from 'react'

import { cn } from '~/lib/cn'
import { stopPropagation } from '~/lib/dom'

type DialogContextType = {
  isOpen: boolean
}

const DialogContext = React.createContext<DialogContextType | undefined>(
  undefined,
)

const useDialog = (): DialogContextType => {
  const context = React.use(DialogContext)
  if (!context) {
    throw new Error('useDialog must be used within a Dialog')
  }
  return context
}

type DialogProps = React.ComponentProps<typeof DialogPrimitive.Root>

function Dialog({ children, ...props }: DialogProps) {
  const [isOpen, setIsOpen] = React.useState(
    props?.open ?? props?.defaultOpen ?? false,
  )

  React.useEffect(() => {
    if (props?.open !== undefined) setIsOpen(props.open)
  }, [props?.open])

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      setIsOpen(open)
      props.onOpenChange?.(open)
    },
    [props],
  )

  return (
    <DialogContext value={React.useMemo(() => ({ isOpen }), [isOpen])}>
      <DialogPrimitive.Root
        data-slot="dialog"
        {...props}
        onOpenChange={handleOpenChange}
      >
        {children}
      </DialogPrimitive.Root>
    </DialogContext>
  )
}

type DialogTriggerProps = React.ComponentProps<typeof DialogPrimitive.Trigger>

function DialogTrigger(props: DialogTriggerProps) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

type DialogPortalProps = React.ComponentProps<typeof DialogPrimitive.Portal>

function DialogPortal(props: DialogPortalProps) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

type DialogCloseProps = React.ComponentProps<typeof DialogPrimitive.Close>

function DialogClose(props: DialogCloseProps) {
  return (
    <DialogPrimitive.Close
      data-slot="dialog-close"
      {...props}
      className={cn('contents', props.className)}
    />
  )
}

type DialogOverlayProps = React.ComponentProps<typeof DialogPrimitive.Overlay>

function DialogOverlay({ className, ...props }: DialogOverlayProps) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'bg-material-medium data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50',
        className,
      )}
      {...props}
    />
  )
}

export type DialogContentProps = React.ComponentProps<
  typeof DialogPrimitive.Content
> &
  HTMLMotionProps<'div'> & {
    transition?: Transition
    showCloseButton?: boolean
    disableOverlayClickToClose?: boolean
    disableTransition?: boolean
  }

const contentTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
}

function DialogContent({
  className,
  children,
  transition = contentTransition,
  showCloseButton = true,

  disableOverlayClickToClose = false,
  disableTransition = false,
  ...props
}: DialogContentProps) {
  const { isOpen } = useDialog()

  const transitionVariants = React.useMemo(() => {
    if (disableTransition) {
      return {
        initial: { opacity: 0.96 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    }
    return {
      initial: { opacity: 0, scale: 0.95, y: -20 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.95, y: -20 },
    }
  }, [disableTransition])

  return (
    <AnimatePresence>
      {isOpen && (
        <DialogPortal forceMount data-slot="dialog-portal">
          <DialogOverlay asChild forceMount>
            <motion.div
              key="dialog-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              onClick={stopPropagation}
            />
          </DialogOverlay>
          <DialogPrimitive.Content asChild forceMount {...props}>
            <motion.div
              key="dialog-content"
              data-slot="dialog-content"
              initial={transitionVariants.initial}
              animate={transitionVariants.animate}
              exit={transitionVariants.exit}
              transition={transition}
              className={cn(
                'border-border bg-background fixed top-[50%] left-[50%] z-50 grid max-h-[calc(100svh-3rem)] w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-xl border p-4 shadow-lg',
                disableOverlayClickToClose
                  ? 'pointer-events-none [&_*]:pointer-events-auto'
                  : '',
                className,
              )}
              {...props}
            >
              {children}
              {showCloseButton && (
                <DialogPrimitive.Close className="focus:bg-fill data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 flex size-6 items-center justify-center rounded-sm focus:outline-none disabled:pointer-events-none">
                  <i className="i-mingcute-close-line size-4" />
                  <span className="sr-only">Close</span>
                </DialogPrimitive.Close>
              )}
            </motion.div>
          </DialogPrimitive.Content>
        </DialogPortal>
      )}
    </AnimatePresence>
  )
}

type DialogHeaderProps = React.ComponentProps<'div'>

function DialogHeader({ className, ...props }: DialogHeaderProps) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        'flex flex-col space-y-1.5 text-center sm:text-left',
        className,
      )}
      {...props}
    />
  )
}

type DialogFooterProps = React.ComponentProps<'div'>

function DialogFooter({ className, ...props }: DialogFooterProps) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  )
}

type DialogTitleProps = React.ComponentProps<typeof DialogPrimitive.Title>

function DialogTitle({ className, ...props }: DialogTitleProps) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        'text-lg leading-none font-semibold tracking-tight',
        className,
      )}
      {...props}
    />
  )
}

type DialogDescriptionProps = React.ComponentProps<
  typeof DialogPrimitive.Description
>

function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  type DialogCloseProps,
  DialogContent,
  type DialogContextType,
  DialogDescription,
  type DialogDescriptionProps,
  DialogFooter,
  type DialogFooterProps,
  DialogHeader,
  type DialogHeaderProps,
  DialogOverlay,
  type DialogOverlayProps,
  DialogPortal,
  type DialogPortalProps,
  type DialogProps,
  DialogTitle,
  type DialogTitleProps,
  DialogTrigger,
  type DialogTriggerProps,
}
