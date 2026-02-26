'use client'

import { Select as SelectPrimitive } from 'radix-ui'
import type { FC } from 'react'
import * as React from 'react'
import { useCallback, useState } from 'react'

import { clsxm, focusRing } from '~/lib/cn'

import { Modal } from '../modal/ModalManager'
import { RootPortal } from '../portal'
import { InputPrompt } from '../prompts/InputPrompt'
import { SelectItem, SelectSeparator } from './Select'

interface ComboboxSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  options?: string[]
  allowCustom?: boolean
  disabled?: boolean
  size?: 'default' | 'sm'
  className?: string
  label?: string
  customInputTitle?: string
  customInputDescription?: string
  customInputPlaceholder?: string
}

const DEFAULT_OPTIONS: string[] = []

export const ComboboxSelect: FC<ComboboxSelectProps> = ({
  value,
  onValueChange,
  placeholder = 'Select an option...',
  options = DEFAULT_OPTIONS,
  allowCustom = true,
  disabled = false,
  size = 'default',
  className,
  label,
  customInputTitle = 'Add Custom Value',
  customInputDescription = 'Enter a new custom value',
  customInputPlaceholder = 'Enter custom value...',
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleValueChange = useCallback(
    (newValue: string) => {
      if (newValue === '__ADD_CUSTOM__') {
        // Close the select dropdown first
        setIsOpen(false)

        // Present the input modal
        Modal.present(InputPrompt, {
          title: customInputTitle,
          description: customInputDescription,
          placeholder: customInputPlaceholder,
          onConfirm: (customValue: string) => {
            if (customValue.trim()) {
              onValueChange?.(customValue.trim())
            }
          },
        })
        return
      }
      // Convert special empty placeholder back to empty string
      const actualValue = newValue === '__EMPTY__' ? '' : newValue
      onValueChange?.(actualValue)
      setIsOpen(false)
    },
    [
      onValueChange,
      customInputTitle,
      customInputDescription,
      customInputPlaceholder,
    ],
  )

  return (
    <div className="w-full">
      {label && (
        <label className="text-text mb-2 block text-sm font-medium">
          {label}
        </label>
      )}
      <SelectPrimitive.Root
        value={value === '' ? '__EMPTY__' : value}
        onValueChange={handleValueChange}
        open={isOpen}
        onOpenChange={setIsOpen}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          className={clsxm(
            'flex w-full items-center justify-between rounded-lg bg-transparent whitespace-nowrap',
            focusRing,
            'transition-all duration-200 outline-none',
            'border-border hover:border-fill border',
            size === 'sm' ? 'h-8 px-3 text-sm' : 'h-9 px-3.5 py-2 text-sm',
            'placeholder:text-text-secondary',
            'disabled:cursor-not-allowed disabled:opacity-50',
            '[&>span]:line-clamp-1',
            'shadow-sm shadow-zinc-100 hover:shadow dark:shadow-zinc-800',
            className,
            disabled && 'cursor-not-allowed opacity-30',
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon asChild>
            <i className="i-mingcute-down-line text-text-secondary -mr-1 ml-2 size-4 shrink-0 opacity-60 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <RootPortal>
          <SelectPrimitive.Content
            className={clsxm(
              'bg-material-medium backdrop-blur-background text-text border-border z-[60] max-h-96 min-w-32 overflow-hidden rounded-[6px] border p-1',
              'shadow-context-menu',
            )}
            position="item-aligned"
          >
            <SelectPrimitive.Viewport className="p-0">
              {options.length === 0 && !allowCustom ? (
                <div className="text-text-secondary px-2.5 py-1 text-sm">
                  No options available
                </div>
              ) : (
                <>
                  {options.map((option) => (
                    <SelectItem
                      key={option || '__EMPTY__'}
                      value={option || '__EMPTY__'}
                    >
                      {option || 'No category'}
                    </SelectItem>
                  ))}

                  {allowCustom && (
                    <>
                      {options.length > 0 && <SelectSeparator />}
                      <SelectItem value="__ADD_CUSTOM__">
                        <span className="flex items-center gap-2">
                          <i className="i-mingcute-add-line size-3" />
                          Add custom...
                        </span>
                      </SelectItem>
                    </>
                  )}
                </>
              )}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </RootPortal>
      </SelectPrimitive.Root>
    </div>
  )
}
