import { assertType, expectTypeOf, test } from "vitest"

import type { CopyLinkCommand } from "../commands/entry"
import { COMMAND_ID } from "../commands/id"
import { getCommand, useCommand, useRunCommandFn } from "./use-command"

test("getCommand types work properly", () => {
  expectTypeOf(getCommand(COMMAND_ID.entry.copyLink)).toMatchTypeOf<CopyLinkCommand | null>()

  // @ts-expect-error - get an unknown command should throw an error
  assertType(getCmd("unknown command"))
})

test("useCommand types work properly", () => {
  const copyCmd = useCommand(COMMAND_ID.entry.copyLink)
  expectTypeOf(copyCmd).toMatchTypeOf<CopyLinkCommand | null>()

  // @ts-expect-error - get an unknown command should throw an error
  assertType(useCommand("unknown command"))
})

test("useRunCommandFn types work properly", () => {
  const runCmdFn = useRunCommandFn()
  expectTypeOf(runCmdFn).toBeFunction()

  assertType(runCmdFn(COMMAND_ID.entry.copyLink, [{ entryId: "1" }]))
  // @ts-expect-error - invalid argument type
  assertType(runCmdFn(COMMAND_ID.entry.copyLink, [{ entryId: 1 }]))
  // @ts-expect-error - invalid argument type
  assertType(runCmdFn(COMMAND_ID.entry.copyLink, []))
  // @ts-expect-error - invalid argument type
  assertType(runCmdFn(COMMAND_ID.entry.copyLink, [1]))
})
