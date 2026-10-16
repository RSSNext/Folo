import { describe, expect, test } from "vitest"

import { keepModalOpenForExpandedCombobox } from "./helper"

const pressEscapeOn = (target: HTMLElement) => {
  document.body.append(target)
  const event = new KeyboardEvent("keydown", { key: "Escape", cancelable: true })
  target.addEventListener("keydown", keepModalOpenForExpandedCombobox)
  target.dispatchEvent(event)
  target.remove()
  return event
}

describe("keepModalOpenForExpandedCombobox", () => {
  test("keeps the modal open while a combobox shows its suggestions", () => {
    const input = document.createElement("input")
    input.setAttribute("role", "combobox")
    input.setAttribute("aria-expanded", "true")

    expect(pressEscapeOn(input).defaultPrevented).toBe(true)
  })

  test("lets Escape close the modal from a closed combobox", () => {
    const input = document.createElement("input")
    input.setAttribute("role", "combobox")
    input.setAttribute("aria-expanded", "false")

    expect(pressEscapeOn(input).defaultPrevented).toBe(false)
  })

  test("lets Escape close the modal from an expanded disclosure button", () => {
    const button = document.createElement("button")
    button.setAttribute("aria-expanded", "true")

    expect(pressEscapeOn(button).defaultPrevented).toBe(false)
  })
})
