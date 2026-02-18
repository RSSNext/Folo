/* eslint-disable @eslint-react/no-array-index-key */
import { UserRole } from "@follow/constants"
import { SettingPaidLevels } from "@follow/shared/settings/constants"
import { useUserRole } from "@follow/store/user/hooks"
import type { FC, ReactNode } from "react"
import * as React from "react"
import { isValidElement } from "react"

import { SettingActionItem, SettingDescription, SettingInput, SettingSwitch } from "../control"
import { SettingItemGroup, SettingSectionTitle } from "../section"

export { SettingPaidLevels } from "@follow/shared/settings/constants"

type SharedSettingItem = {
  disabled?: boolean
}

export type SettingItem<T, K extends keyof T = keyof T> = {
  key: K
  label: string
  description?: string
  onChange: (value: T[K]) => void
  onChangeGuard?: (value: T[K]) => "handled" | void
  type?: "password"

  vertical?: boolean

  componentProps?: {
    labelClassName?: string
    className?: string
    [key: string]: any
  }
  paidLevel?: SettingPaidLevels
} & SharedSettingItem

type SectionSettingItem = {
  type: "title"
  value?: string
  id?: string
} & SharedSettingItem

type ActionSettingItem = {
  label: string
  action: () => void
  description?: string
  buttonText: string
} & SharedSettingItem
type CustomSettingItem = ReactNode | FC

export const createSettingBuilder =
  <T extends object>(useSetting: () => T) =>
  <K extends keyof T>(props: {
    settings: (
      | SettingItem<T, K>
      | SectionSettingItem
      | CustomSettingItem
      | ActionSettingItem
      | boolean
    )[]
  }) => {
    const { settings } = props
    const settingObject = useSetting()
    const role = useUserRole()

    const filteredSettings = settings.filter((i) => !!i)
    return filteredSettings.map((setting, index) => {
      if (isValidElement(setting)) return setting
      if (typeof setting === "function") {
        return React.createElement(setting, { key: index })
      }
      const assertSetting = setting as SettingItem<T> | SectionSettingItem | ActionSettingItem

      if (!assertSetting) return null
      // if (assertSetting.disabled) return null

      const nextItem = filteredSettings[index + 1]
      // If has no next item or next item is also a title, then it is an empty section
      const isEmptySection =
        !nextItem ||
        (typeof nextItem === "object" && "type" in nextItem && nextItem.type === "title")

      const isValidTitle =
        "type" in assertSetting &&
        assertSetting.type === "title" &&
        assertSetting.value &&
        !isEmptySection

      if (isValidTitle) {
        return (
          <SettingSectionTitle
            key={index}
            title={assertSetting.value}
            sectionId={assertSetting.id}
          />
        )
      }
      if ("type" in assertSetting && assertSetting.type === "title") {
        return null
      }
      const disabledForRole =
        role === UserRole.Free &&
        "paidLevel" in assertSetting &&
        assertSetting.paidLevel !== undefined &&
        assertSetting.paidLevel !== SettingPaidLevels.Free &&
        assertSetting.paidLevel !== SettingPaidLevels.FreeLimited

      let ControlElement: React.ReactNode

      if ("key" in assertSetting) {
        switch (typeof settingObject[assertSetting.key]) {
          case "boolean": {
            ControlElement = (
              <SettingSwitch
                className="mt-4"
                checked={settingObject[assertSetting.key] as boolean}
                onCheckedChange={(checked) => {
                  if (assertSetting.onChangeGuard) {
                    const handled = assertSetting.onChangeGuard(checked as T[keyof T])
                    if (handled === "handled") {
                      return
                    }
                  }
                  assertSetting.onChange(checked as T[keyof T])
                }}
                label={assertSetting.label}
                disabled={assertSetting.disabled || disabledForRole}
                paidLevel={assertSetting.paidLevel}
              />
            )
            break
          }
          case "string": {
            ControlElement = (
              <SettingInput
                vertical={assertSetting.vertical}
                labelClassName={assertSetting.componentProps?.labelClassName}
                type={assertSetting.type || "text"}
                className="mt-4"
                value={settingObject[assertSetting.key] as string}
                onChange={(event) => assertSetting.onChange(event.target.value as T[keyof T])}
                label={assertSetting.label}
              />
            )
            break
          }
          default: {
            return null
          }
        }
      } else if ("action" in assertSetting) {
        ControlElement = <SettingActionItem {...assertSetting} key={index} />
      }

      return (
        <SettingItemGroup key={index}>
          {ControlElement}
          {!!assertSetting.description && (
            <SettingDescription>{assertSetting.description}</SettingDescription>
          )}
        </SettingItemGroup>
      )
    })
  }
