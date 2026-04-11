import { defaultSpotlightColor } from "@follow/shared/spotlight"
import commonEn from "@locales/common/en.json"
import settingsEn from "@locales/settings/en.json"
import { Provider } from "jotai"
import * as React from "react"
import { act } from "react"
import type { Root } from "react-dom/client"
import { createRoot } from "react-dom/client"
import { afterEach, beforeAll, describe, expect, test, vi } from "vitest"

import {
  getSpotlightSettings,
  initializeDefaultSpotlightSettings,
  setSpotlightSetting,
} from "~/atoms/settings/spotlight"
import { jotaiStore } from "~/lib/jotai"

import { SettingSpotlight } from "./spotlight"

vi.mock("react-i18next", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-i18next")>()
  const mockedTranslation = () => ({
    t: (key: keyof typeof settingsEn | keyof typeof commonEn) =>
      settingsEn[key as keyof typeof settingsEn] ?? commonEn[key as keyof typeof commonEn] ?? key,
  })

  return {
    ...actual,
    useTranslation: mockedTranslation,
  }
})

const renderSpotlightTab = async () => {
  const container = document.createElement("div")
  document.body.append(container)

  const root = createRoot(container)

  await act(async () => {
    root.render(
      <Provider store={jotaiStore}>
        <SettingSpotlight />
      </Provider>,
    )
  })

  return { container, root }
}

const getButtonByText = (
  container: HTMLElement,
  text: string,
  options?: { enabledOnly?: boolean; index?: number },
) => {
  const { enabledOnly = false, index = 0 } = options ?? {}
  const button = Array.from(container.querySelectorAll("button")).filter(
    (element) =>
      element.textContent?.trim() === text &&
      (!enabledOnly || !(element as HTMLButtonElement).disabled),
  )[index]

  if (!button) {
    throw new Error(`Button not found: ${text}`)
  }

  return button as HTMLButtonElement
}

const getInputByIdPrefix = (container: HTMLElement, prefix: string, index = 0) => {
  const input = Array.from(container.querySelectorAll("input")).filter((element) =>
    element.id.startsWith(prefix),
  )[index]

  if (!input) {
    throw new Error(`Input not found: ${prefix}`)
  }

  return input as HTMLInputElement
}

const getElementByIdPrefix = (container: HTMLElement, prefix: string, index = 0) => {
  const element = Array.from(container.querySelectorAll<HTMLElement>(`[id^="${prefix}"]`))[index]

  if (!element) {
    throw new Error(`Element not found: ${prefix}`)
  }

  return element
}

const getColorButtonByValue = (container: HTMLElement, value: string, index = 0) => {
  const button = Array.from(
    container.querySelectorAll<HTMLButtonElement>(`[data-spotlight-color-option="${value}"]`),
  )[index]

  if (!button) {
    throw new Error(`Color button not found: ${value}`)
  }

  return button
}

const getReactProps = <T extends object>(element: HTMLElement): T => {
  const reactPropsKey = Object.keys(element).find((key) => key.startsWith("__reactProps"))
  if (!reactPropsKey) {
    throw new Error("React props key not found")
  }

  return (element as unknown as Record<string, T>)[reactPropsKey] as T
}

const setInputValue = async (input: HTMLInputElement, value: string) => {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")
  expect(descriptor?.set).toBeDefined()

  await act(async () => {
    input.focus()
    descriptor!.set!.call(input, value)
    input.setAttribute("value", value)
    input.dispatchEvent(
      new InputEvent("input", { bubbles: true, data: value, inputType: "insertText" }),
    )
    input.dispatchEvent(new Event("change", { bubbles: true }))
    const reactProps = getReactProps<{ onChange?: (event: { target: HTMLInputElement }) => void }>(
      input,
    )
    reactProps.onChange?.({
      target: input,
    })
    input.blur()
    await Promise.resolve()
  })
}

const click = async (element: HTMLElement) => {
  await act(async () => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }))
  })
}

const overrideDispatchEvent = (dispatchEvent: typeof window.dispatchEvent) => {
  Object.defineProperty(window, "dispatchEvent", {
    configurable: true,
    value: dispatchEvent,
  })
}

const restoreDispatchEvent = (dispatchEvent: typeof window.dispatchEvent | undefined) => {
  if (dispatchEvent) {
    overrideDispatchEvent(dispatchEvent)
    return
  }

  Reflect.deleteProperty(window, "dispatchEvent")
}

describe("SettingSpotlight", () => {
  let root: Root | null = null
  let container: HTMLElement | null = null
  let previousDispatchEvent: typeof window.dispatchEvent | undefined

  beforeAll(() => {
    ;(globalThis as typeof globalThis & { React: typeof React }).React = React
    ;(
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
  })

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount()
      })
    }
    container?.remove()
    root = null
    container = null

    initializeDefaultSpotlightSettings()
    setSpotlightSetting("spotlights", [])
    restoreDispatchEvent(previousDispatchEvent)
  })

  test("updates spotlight settings when adding and editing a rule", async () => {
    initializeDefaultSpotlightSettings()
    previousDispatchEvent = window.dispatchEvent
    overrideDispatchEvent(vi.fn() as typeof window.dispatchEvent)
    ;({ container, root } = await renderSpotlightTab())

    await click(getButtonByText(container!, "Add rule"))

    let rules = getSpotlightSettings().spotlights
    expect(rules).toHaveLength(1)
    expect(rules[0]).toMatchObject({
      pattern: "",
      patternType: "keyword",
      caseSensitive: false,
      color: defaultSpotlightColor,
    })

    await setInputValue(getInputByIdPrefix(container!, "spotlight-pattern-"), "alpha")
    rules = getSpotlightSettings().spotlights
    expect(rules[0]?.pattern).toBe("alpha")

    await click(getButtonByText(container!, "Regex"))
    rules = getSpotlightSettings().spotlights
    expect(rules[0]?.patternType).toBe("regex")

    await click(getElementByIdPrefix(container!, "spotlight-enabled-"))
    rules = getSpotlightSettings().spotlights
    expect(rules[0]?.enabled).toBe(false)

    await click(getElementByIdPrefix(container!, "spotlight-case-sensitive-"))
    rules = getSpotlightSettings().spotlights
    expect(rules[0]?.caseSensitive).toBe(true)

    await click(getColorButtonByValue(container!, "#60A5FA"))
    rules = getSpotlightSettings().spotlights
    expect(rules[0]?.color).toBe("#60A5FA")
  })

  test("renders an inline error when a regex pattern is invalid", async () => {
    initializeDefaultSpotlightSettings()
    previousDispatchEvent = window.dispatchEvent
    overrideDispatchEvent(vi.fn() as typeof window.dispatchEvent)
    ;({ container, root } = await renderSpotlightTab())

    await click(getButtonByText(container!, "Add rule"))
    await click(getButtonByText(container!, "Regex"))
    await setInputValue(getInputByIdPrefix(container!, "spotlight-pattern-"), "[")

    expect(container!.textContent).toContain("Invalid regex")
  })

  test("reorders spotlight rules when move buttons are clicked", async () => {
    initializeDefaultSpotlightSettings()
    previousDispatchEvent = window.dispatchEvent
    overrideDispatchEvent(vi.fn() as typeof window.dispatchEvent)
    ;({ container, root } = await renderSpotlightTab())

    await click(getButtonByText(container!, "Add rule"))
    await click(getButtonByText(container!, "Add rule"))

    const initialIds = getSpotlightSettings().spotlights.map((rule) => rule.id)
    expect(initialIds).toHaveLength(2)

    await click(getButtonByText(container!, "Move down", { enabledOnly: true }))
    expect(getSpotlightSettings().spotlights.map((rule) => rule.id)).toEqual([
      initialIds[1]!,
      initialIds[0]!,
    ])

    await click(getButtonByText(container!, "Move up", { enabledOnly: true }))
    expect(getSpotlightSettings().spotlights.map((rule) => rule.id)).toEqual(initialIds)
  })

  test("deletes the selected spotlight rule", async () => {
    initializeDefaultSpotlightSettings()
    previousDispatchEvent = window.dispatchEvent
    overrideDispatchEvent(vi.fn() as typeof window.dispatchEvent)
    ;({ container, root } = await renderSpotlightTab())

    await click(getButtonByText(container!, "Add rule"))
    await click(getButtonByText(container!, "Add rule"))

    expect(getSpotlightSettings().spotlights).toHaveLength(2)

    await click(getButtonByText(container!, "Delete", { index: 0 }))

    expect(getSpotlightSettings().spotlights).toHaveLength(1)
  })
})
