import { describe, expect, it } from "vitest"

import type { ToolbarActionOrder } from "./constant"
import { moveActionToContainer, reorderActionInContainer } from "./order"

const order: ToolbarActionOrder = {
  main: ["a", "b", "c"],
  more: ["d", "e"],
}

describe("moveActionToContainer", () => {
  it("moves the action into the other container at the position of the hovered action", () => {
    expect(moveActionToContainer(order, "b", "e")).toEqual({
      main: ["a", "c"],
      more: ["d", "b", "e"],
    })
    expect(moveActionToContainer(order, "d", "a")).toEqual({
      main: ["d", "a", "b", "c"],
      more: ["e"],
    })
  })

  it("skips actions that are already in the hovered container", () => {
    expect(moveActionToContainer(order, "a", "c")).toBeNull()
    expect(moveActionToContainer(order, "a", "a")).toBeNull()
  })

  it("skips unknown ids", () => {
    expect(moveActionToContainer(order, "a", "unknown")).toBeNull()
    expect(moveActionToContainer(order, "unknown", "d")).toBeNull()
  })
})

describe("reorderActionInContainer", () => {
  it("moves the action to the position of the action it is dropped on", () => {
    expect(reorderActionInContainer(order, "a", "c")).toEqual({
      main: ["b", "c", "a"],
      more: ["d", "e"],
    })
    expect(reorderActionInContainer(order, "e", "d")).toEqual({
      main: ["a", "b", "c"],
      more: ["e", "d"],
    })
  })

  it("returns null when the order doesn't change", () => {
    expect(reorderActionInContainer(order, "b", "b")).toBeNull()
    expect(reorderActionInContainer(order, "a", "d")).toBeNull()
  })
})
