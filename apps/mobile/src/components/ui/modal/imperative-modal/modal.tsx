import { nanoid } from "nanoid/non-secure"
import type { ReactNode } from "react"
import { cloneElement, useState } from "react"
import { useTranslation } from "react-i18next"
import { TouchableOpacity, View } from "react-native"
import RootSiblings from "react-native-root-siblings"

import { HeaderSubmitTextButton } from "@/src/components/layouts/header/HeaderElements"
import { Text } from "@/src/components/ui/typography/Text"

import type { BottomModalProps } from "../BottomModal"
import { BottomModal } from "../BottomModal"
import { Header, HeaderText, Input } from "./templates"

export type Modal = {
  id: string
  content: ReactNode
} & Omit<BottomModalProps, "visible" | "children">
export type ModalInput = Omit<Modal, "id" | "closeOnBackdropPress"> & {
  /**
   * Optional: Will be auto-generated with nanoid if not provided
   */
  id?: string
  /**
   * Default is true
   */
  closeOnBackdropPress?: false
  /**
   * Select template for the modal.
   *
   * @default 'plain'
   */
  // type?: "plain" // | 'select' | 'confirm' | 'input' | 'custom'
  abortController?: AbortController
}
export const openModal = (modal: ModalInput) => {
  const promise = Promise.withResolvers<void>()
  const abortController = modal.abortController || new AbortController()
  const node = (
    <BottomModal
      id={modal.id || nanoid()}
      visible={true}
      {...modal}
      onClose={() => {
        abortController.abort()
        siblings.destroy()
        modal.onClose?.()
        promise.resolve()
      }}
    >
      {modal.content}
    </BottomModal>
  )
  const siblings = new RootSiblings(node)
  abortController.signal.addEventListener("abort", () => {
    const newNode = cloneElement(node, {
      visible: false,
    })
    siblings.update(newNode)
  })
  return promise.promise
}
const PromptModal = ({
  defaultValue,
  title,
  placeholder,
  onSave,
  abortController,
}: {
  defaultValue?: string
  title?: string
  placeholder?: string
  onSave: (newCategory: string) => void
  abortController: AbortController
}) => {
  const { t } = useTranslation()
  const [text, setText] = useState(defaultValue ?? "")
  return (
    <View className="flex-1">
      <Header
        renderLeft={() => (
          <HeaderSubmitTextButton
            label={t("words.cancel", {
              ns: "common",
            })}
            isValid={true}
            onPress={() => {
              abortController.abort()
            }}
          />
        )}
      >
        <HeaderText>{title}</HeaderText>
      </Header>
      <View className="flex flex-1 gap-4 p-4">
        <Input
          className="box-border w-full"
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
        />
        <TouchableOpacity
          className="bg-accent w-full rounded-xl px-6 py-3"
          disabled={text.trim().length === 0}
          onPress={() => {
            onSave(text)
            abortController.abort()
          }}
        >
          <Text className="text-center text-base font-semibold text-white">
            {t("words.save", {
              ns: "common",
            })}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
export const modalPrompt = (
  title: string,
  message: string,
  callback: (text: string) => void,
  type?: undefined,
  defaultValue?: string,
) => {
  const abortController = new AbortController()
  openModal({
    abortController,
    closeOnBackdropPress: false,
    content: (
      <PromptModal
        title={title}
        defaultValue={defaultValue}
        placeholder={message}
        abortController={abortController}
        onSave={callback}
      />
    ),
  })
}
