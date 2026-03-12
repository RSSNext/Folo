'use client'

// Tremor RadioGroup [v1.0.0]
import type { HTMLMotionProps } from 'motion/react'
import { m as motion } from 'motion/react'
import { RadioGroup as RadioGroupPrimitives } from 'radix-ui'
import * as React from 'react'

import { cx, focusRing } from '~/lib/cn'

const RadioGroup = ({
  ref: forwardedRef,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadioGroupPrimitives.Root> & {
  ref?: React.RefObject<React.ElementRef<
    typeof RadioGroupPrimitives.Root
  > | null>
}) => {
  return (
    <RadioGroupPrimitives.Root
      ref={forwardedRef}
      className={cx('grid gap-2', className)}
      tremor-id="tremor-raw"
      {...props}
    />
  )
}

RadioGroup.displayName = 'RadioGroup'

const RadioGroupIndicator = ({
  ref: forwardedRef,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadioGroupPrimitives.Indicator> & {
  ref?: React.RefObject<React.ElementRef<
    typeof RadioGroupPrimitives.Indicator
  > | null>
}) => {
  return (
    <RadioGroupPrimitives.Indicator
      ref={forwardedRef}
      className={cx('flex items-center justify-center', className)}
      {...props}
      asChild
    >
      <motion.div
        className={cx(
          // base
          'size-1.5 shrink-0 rounded-full',
          // indicator
          'bg-white',
          // disabled
          'group-data-disabled:bg-disabled-control',
        )}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
          duration: 0.2,
        }}
      />
    </RadioGroupPrimitives.Indicator>
  )
}

RadioGroupIndicator.displayName = 'RadioGroupIndicator'

const RadioGroupItem = ({
  ref: forwardedRef,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadioGroupPrimitives.Item> &
  HTMLMotionProps<'button'> & {
    ref?: React.RefObject<React.ElementRef<
      typeof RadioGroupPrimitives.Item
    > | null>
  }) => {
  return (
    <RadioGroupPrimitives.Item
      ref={forwardedRef}
      className={cx(
        'group relative flex size-4 appearance-none items-center justify-center outline-hidden',
        className,
      )}
      {...props}
      asChild
    >
      <motion.button
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 25,
        }}
      >
        <motion.div
          className={cx(
            // base
            'flex size-4 shrink-0 items-center justify-center rounded-full border shadow-xs transition-colors duration-200',
            // border color
            'border-border',
            // background color
            'bg-background',
            // checked
            'group-data-[state=checked]:bg-accent group-data-[state=checked]:border-0 group-data-[state=checked]:border-transparent',
            // disabled
            'group-data-disabled:border',
            'group-data-disabled:border-border group-data-disabled:bg-disabled-control group-data-disabled:text-disabled-text',
            // focus
            focusRing,
          )}
          animate={{
            scale: props.checked ? 1.1 : 1,
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20,
            duration: 0.15,
          }}
        >
          <RadioGroupIndicator />
        </motion.div>
      </motion.button>
    </RadioGroupPrimitives.Item>
  )
}

RadioGroupItem.displayName = 'RadioGroupItem'

export { RadioGroup, RadioGroupItem }
