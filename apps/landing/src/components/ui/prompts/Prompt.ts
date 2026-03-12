import { Modal } from '../modal'
import type { PromptOptions } from './BasePrompt'
import { BasePrompt } from './BasePrompt'
import type { InputPromptOptions } from './InputPrompt'
import { InputPrompt } from './InputPrompt'

export const Prompt = {
  prompt(options: PromptOptions) {
    return Modal.present(BasePrompt, options)
  },
  input(options: InputPromptOptions): Promise<string | null> {
    return new Promise((resolve) => {
      Modal.present(InputPrompt, {
        ...options,
        onConfirm: async (value: string) => {
          await options.onConfirm?.(value)
          resolve(value)
        },
        onCancel: async () => {
          await options.onCancel?.()
          resolve(null)
        },
      })
    })
  },
}
