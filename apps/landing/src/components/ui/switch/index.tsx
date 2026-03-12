'use client'

import type { HTMLMotionProps } from 'motion/react'
import { m as motion } from 'motion/react'
import { Switch as SwitchPrimitives } from 'radix-ui'
import * as React from 'react'

import { cn } from '~/lib/cn'

type SwitchProps = React.ComponentProps<typeof SwitchPrimitives.Root> &
  HTMLMotionProps<'button'> & {
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
    thumbIcon?: React.ReactNode
  }

function Switch({
  className,
  leftIcon,
  rightIcon,
  thumbIcon,
  onCheckedChange,
  ...props
}: SwitchProps) {
  const [isChecked, setIsChecked] = React.useState(
    props?.checked ?? props?.defaultChecked ?? false,
  )
  const [isTapped, setIsTapped] = React.useState(false)

  React.useEffect(() => {
    if (props?.checked !== undefined) setIsChecked(props.checked)
  }, [props?.checked])

  const handleCheckedChange = React.useCallback(
    (checked: boolean) => {
      setIsChecked(checked)
      onCheckedChange?.(checked)
    },
    [onCheckedChange],
  )
  // Avoid motion layout animations; use explicit transform animation instead
  const TRACK_WIDTH = 40 // w-10 => 2.5rem => 40px
  const TRACK_PADDING = 3 // p-[3px]
  const THUMB_SIZE = 18
  const CHECKED_X = TRACK_WIDTH - TRACK_PADDING * 2 - THUMB_SIZE
  return (
    <SwitchPrimitives.Root
      {...props}
      onCheckedChange={handleCheckedChange}
      asChild
    >
      <motion.button
        data-slot="switch"
        className={cn(
          'cursor-switch focus-visible:ring-accent focus-visible:ring-offset-background data-[state=checked]:bg-accent data-[state=unchecked]:bg-fill-secondary relative flex h-6 w-10 shrink-0 items-center justify-start rounded-full p-[3px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        whileTap="tap"
        initial={false}
        onTapStart={() => setIsTapped(true)}
        onTapCancel={() => setIsTapped(false)}
        onTap={() => setIsTapped(false)}
        {...props}
      >
        {leftIcon != null ? (
          <motion.div
            data-slot="switch-left-icon"
            animate={
              isChecked ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }
            }
            transition={{ type: 'spring', bounce: 0 }}
            className="text-text-secondary absolute top-1/2 left-1 -translate-y-1/2 [&_svg]:size-3"
          >
            {typeof leftIcon !== 'string' ? leftIcon : null}
          </motion.div>
        ) : null}

        {rightIcon != null ? (
          <motion.div
            data-slot="switch-right-icon"
            animate={
              isChecked ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }
            }
            transition={{ type: 'spring', bounce: 0 }}
            className="text-text-secondary absolute top-1/2 right-1 -translate-y-1/2 [&_svg]:size-3"
          >
            {typeof rightIcon !== 'string' ? rightIcon : null}
          </motion.div>
        ) : null}

        <SwitchPrimitives.Thumb asChild>
          <motion.div
            data-slot="switch-thumb"
            whileTap="tab"
            className={
              'bg-background text-text-secondary relative z-[1] flex items-center justify-center rounded-full shadow-lg ring-0 [&_svg]:size-3'
            }
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 25 },
              width: { duration: 0.1 },
            }}
            style={{
              width: THUMB_SIZE,
              height: THUMB_SIZE,
            }}
            initial
            animate={{
              x: isChecked ? CHECKED_X : 0,
              width: isTapped ? 21 : THUMB_SIZE,
            }}
          >
            {thumbIcon && typeof thumbIcon !== 'string' ? thumbIcon : null}
          </motion.div>
        </SwitchPrimitives.Thumb>
      </motion.button>
    </SwitchPrimitives.Root>
  )
}

export { Switch, type SwitchProps }
