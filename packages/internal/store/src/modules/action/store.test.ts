import { beforeEach, describe, expect, test } from "vitest"

import { actionActions, useActionStore } from "./store"

describe("actionActions", () => {
  beforeEach(() => {
    useActionStore.setState({
      rules: [],
      isDirty: false,
    })
  })

  test("creates new rules that match all feeds by default", () => {
    actionActions.addRule((index) => `Action ${index}`)

    expect(useActionStore.getState().rules[0]).toMatchObject({
      name: "Action 1",
      condition: [],
      index: 0,
      result: {},
    })
  })

  test("keeps rule indexes stable after deleting and adding rules", () => {
    actionActions.addRule((index) => `Action ${index}`)
    actionActions.addRule((index) => `Action ${index}`)

    actionActions.deleteRule(0)
    actionActions.addRule((index) => `Action ${index}`)

    expect(useActionStore.getState().rules.map((rule) => rule.index)).toEqual([0, 1])
  })
})
