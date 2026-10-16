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

  test("clears the operator and value when the field type changes", () => {
    actionActions.addRule((index) => `Action ${index}`)
    actionActions.toggleRuleFilter(0)
    const index = { ruleIndex: 0, groupIndex: 0, conditionIndex: 0 }
    actionActions.pathCondition(index, { field: "entry_title", operator: "contains", value: "foo" })

    actionActions.changeConditionField(index, "entry_content")
    expect(useActionStore.getState().rules[0]!.condition[0]![0]).toEqual({
      field: "entry_content",
      operator: "contains",
      value: "foo",
    })

    actionActions.changeConditionField(index, "view")
    expect(useActionStore.getState().rules[0]!.condition[0]![0]).toEqual({ field: "view" })
  })

  test("imports exported rules that have an empty name", () => {
    actionActions.addRule(() => "")
    actionActions.patchRule(0, { result: { star: true } })
    const exported = actionActions.exportRules()
    useActionStore.setState({ rules: [], isDirty: false })

    expect(actionActions.importRules(exported).success).toBe(true)
    expect(useActionStore.getState().rules).toMatchObject([{ name: "", result: { star: true } }])
  })

  test("rejects imported rules without a name", () => {
    const result = actionActions.importRules(
      JSON.stringify({ rules: [{ condition: [], result: {} }] }),
    )

    expect(result.success).toBe(false)
    expect(useActionStore.getState().rules).toEqual([])
  })
})
