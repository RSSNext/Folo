'use client'

import { useState } from 'react'

import { Button } from '~/components/ui/button/Button'
import { Modal } from '~/components/ui/modal/ModalManager'
import type {
  ModalComponent,
  ModalComponentProps,
} from '~/components/ui/modal/types'

import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../dialog'
import { Input } from '../input'

type InputPromptVariant = 'danger' | 'info'

export type InputPromptOptions = {
  title: string
  description?: string
  defaultValue?: string
  placeholder?: string
  variant?: InputPromptVariant
  type?: 'password' | 'text'
  onConfirmText?: string
  onCancelText?: string
  onConfirm?: (value: string) => void | Promise<void>
  onCancel?: () => void | Promise<void>
}

export const InputPrompt: ModalComponent<InputPromptOptions> = ({
  modalId,
  dismiss,
  title,
  description,
  defaultValue = '',
  placeholder,
  variant = 'info',
  type = 'text',
  onConfirmText = 'Confirm',
  onCancelText = 'Cancel',
  onConfirm,
  onCancel,
}: ModalComponentProps & InputPromptOptions) => {
  const [inputValue, setInputValue] = useState(defaultValue)
  const [submitting, setSubmitting] = useState(false)

  const handleCancel = async () => {
    try {
      await onCancel?.()
    } finally {
      dismiss()
    }
  }

  const handleConfirm = async () => {
    try {
      setSubmitting(true)
      await onConfirm?.(inputValue)
    } finally {
      setSubmitting(false)
      Modal.dismiss(modalId)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirm()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  return (
    <div>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description ? (
          <DialogDescription className="text-text-secondary">
            {description}
          </DialogDescription>
        ) : null}
      </DialogHeader>
      <div className="mt-4">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          autoFocus
          type={type}
        />
      </div>
      <DialogFooter className="mt-4">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleCancel}
          disabled={submitting}
        >
          {onCancelText}
        </Button>
        <Button
          size="sm"
          variant={variant === 'danger' ? 'destructive' : 'primary'}
          onClick={handleConfirm}
          isLoading={submitting}
          loadingText={onConfirmText}
        >
          {onConfirmText}
        </Button>
      </DialogFooter>
    </div>
  )
}

InputPrompt.contentClassName = 'max-w-sm'

export type { InputPromptVariant }
