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

type PromptVariant = 'danger' | 'info'

export type PromptOptions = {
  title: string
  description?: string
  variant?: PromptVariant
  onConfirmText?: string
  onCancelText?: string
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void | Promise<void>
  content?: React.ReactNode
}

export const BasePrompt: ModalComponent<PromptOptions> = ({
  modalId,
  dismiss,
  title,
  description,
  variant = 'info',
  onConfirmText = 'Confirm',
  onCancelText = 'Cancel',
  onConfirm,
  onCancel,
  content,
}: ModalComponentProps & PromptOptions) => {
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
      await onConfirm?.()
    } finally {
      setSubmitting(false)
      Modal.dismiss(modalId)
    }
  }

  return (
    <div>
      <DialogHeader className="mb-2">
        <DialogTitle>{title}</DialogTitle>
        {description ? (
          <DialogDescription className="text-text-secondary">
            {description}
          </DialogDescription>
        ) : null}
      </DialogHeader>
      {content != null ? <div className="mt-4">{content}</div> : null}
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

BasePrompt.contentClassName = 'max-w-sm'

export type { PromptVariant }
