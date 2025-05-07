import { assertType, expectTypeOf, test } from "vitest"

import { COMMAND_ID } from "../commands/id"
import type { TipCommand } from "../commands/types"
import { getCommand, useCommand, useRunCommandFn } from "./use-command"

test("getCommand types work properly", () => {
  expectTypeOf(getCommand(COMMAND_ID.entry.tip)).toMatchTypeOf<TipCommand | null>()

  // @ts-expect-error - get an unknown command should throw an error
  assertType(getCmd("unknown command"))
})

test("useCommand types work properly", () => {
  const tipCmd = useCommand(COMMAND_ID.entry.tip)
  expectTypeOf(tipCmd).toMatchTypeOf<TipCommand | null>()

  // @ts-expect-error - get an unknown command should throw an error
  assertType(useCommand("unknown command"))
})

test("useRunCommandFn types work properly", () => {
  const runCmdFn = useRunCommandFn()
  expectTypeOf(runCmdFn).toBeFunction()

  assertType(runCmdFn(COMMAND_ID.entry.tip, [{ entryId: "1" }]))
  // @ts-expect-error - invalid argument type
  assertType(runCmdFn(COMMAND_ID.entry.tip, [{ entryId: 1 }]))
  // @ts-expect-error - invalid argument type
  assertType(runCmdFn(COMMAND_ID.entry.tip, []))
  // @ts-expect-error - invalid argument type
  assertType(runCmdFn(COMMAND_ID.entry.tip, [1]))
})
