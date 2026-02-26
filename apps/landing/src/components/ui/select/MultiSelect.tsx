'use client'

import { AnimatePresence, m } from 'motion/react'
import type { FC } from 'react'
import * as React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { clsxm as cn, focusRing } from '~/lib/cn'
import { Spring } from '~/lib/spring'

interface MultiSelectProps {
  value?: string[]
  onChange?: (value: string[]) => void
  placeholder?: string
  options?: string[]
  allowCustom?: boolean
  disabled?: boolean
  size?: 'default' | 'sm'
  className?: string
  label?: string
  maxHeight?: string
}

const DEFAULT_VALUE: string[] = []
const DEFAULT_OPTIONS: string[] = []

export const MultiSelect: FC<MultiSelectProps> = ({
  value = DEFAULT_VALUE,
  onChange,
  placeholder = 'Select tags...',
  options = DEFAULT_OPTIONS,
  allowCustom = true,
  disabled = false,
  size = 'default',
  className,
  label,
  maxHeight = 'max-h-48',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [customValue, setCustomValue] = useState('')
  const containerRef = useRef<HTMLDivElement | null>(null)

  const handleToggleOption = useCallback(
    (option: string) => {
      const newValue = value.includes(option)
        ? value.filter((v) => v !== option)
        : [...value, option]
      onChange?.(newValue)
    },
    [value, onChange],
  )

  const handleAddCustom = useCallback(() => {
    if (customValue.trim() && !value.includes(customValue.trim())) {
      onChange?.([...value, customValue.trim()])
      setCustomValue('')
    }
  }, [customValue, value, onChange])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleAddCustom()
      }
    },
    [handleAddCustom],
  )

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return
    const handlePointerDown = (e: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [isOpen])

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {label && (
        <label className="text-text mb-2 block text-sm font-medium">
          {label}
        </label>
      )}

      {/* Trigger button (aligned with SelectTrigger) */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        disabled={disabled}
        className={cn(
          'flex w-full items-center justify-between rounded-lg bg-transparent whitespace-nowrap',
          focusRing,
          'transition-all duration-200 outline-none',
          'border-border hover:border-fill border',
          size === 'sm' ? 'h-7 px-2.5 py-1 text-sm' : 'h-8 px-3 py-1.5 text-sm',
          'placeholder:text-text-secondary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          '[&>span]:line-clamp-1',
          'shadow-sm hover:shadow',
          disabled && 'cursor-not-allowed opacity-30',
        )}
      >
        <span
          className={cn('text-text-secondary', value.length > 0 && 'text-text')}
        >
          {value.length > 0 ? `${value.length} selected` : placeholder}
        </span>
        <i
          className={cn(
            'i-mingcute-down-line text-text-secondary -mr-1 ml-2 size-4 shrink-0 opacity-60 transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {/* Dropdown content with motion (aligned with popover styles) */}
      <AnimatePresence>
        {isOpen && (
          <m.div
            key="multi-select-content"
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={Spring.presets.smooth}
            className={cn(
              'bg-background border-border absolute z-[60] mt-1 w-full overflow-hidden rounded-lg border p-1.5 shadow-md',
              maxHeight,
            )}
          >
            <div className="overflow-y-auto">
              {/* Custom input */}
              {allowCustom && (
                <div className="border-border mb-1 border-b p-1">
                  <div className="flex gap-1">
                    <Input
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Add custom tag..."
                      inputClassName="bg-transparent border-transparent appearance-none shadow-none h-7 px-0 !ring-0 !border-0"
                      className="focus:border-border h-7 rounded-md border-transparent bg-transparent px-2 py-1 text-sm shadow-none"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 rounded-md"
                      onClick={handleAddCustom}
                      disabled={
                        !customValue.trim() ||
                        value.includes(customValue.trim())
                      }
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}

              {/* Options */}
              <div className="py-0.5">
                {options.length === 0 ? (
                  <div className="text-text-secondary px-2 py-1.5 text-sm">
                    No tags available
                  </div>
                ) : (
                  options.map((option) => {
                    const selected = value.includes(option)
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleToggleOption(option)}
                        className={cn(
                          'cursor-menu focus:bg-accent relative flex w-full items-center rounded-[5px] px-2.5 py-1 text-left text-sm outline-none select-none focus:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                          'focus-within:outline-transparent',
                          'h-[28px]',
                          selected
                            ? 'bg-accent text-white'
                            : 'hover:bg-accent hover:text-white',
                        )}
                      >
                        <span className="pr-5">{option}</span>
                        {selected && (
                          <span className="absolute right-2 flex size-3.5 items-center justify-center">
                            <i className="i-mingcute-check-fill size-3" />
                          </span>
                        )}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
