import { assertType, expectTypeOf, test } from "vitest"

import { COMMAND_ID } from "../commands/id"
import { defineFollowCommand } from "./command"

test("defineFollowCommand types", () => {
  assertType(
    defineFollowCommand({
      id: COMMAND_ID.entry.openInBrowser,
      label: "",
      run: (data) => {
        expectTypeOf(data).toEqualTypeOf<{
          entryId: string
        }>()
      },
    }),
  )

  assertType(
    defineFollowCommand({
      id: COMMAND_ID.entry.openInBrowser,
      label: "",
      // @ts-expect-error - redundant parameters
      run: (url, _b: number) => console.info(url),
    }),
  )

  assertType(
    defineFollowCommand({
      // @ts-expect-error - unknown id
      id: "unknown id",
      label: "",
      run: () => {},
    }),
  )

  assertType(
    defineFollowCommand({
      id: COMMAND_ID.entry.openInBrowser,
      label: "",
      // @ts-expect-error - invalid type
      run: (_n: number) => {},
    }),
  )
})

test("defineFollowCommand with keyBinding types", () => {
  assertType(
    defineFollowCommand({
      id: COMMAND_ID.entry.viewSourceContent,
      label: "",
      when: true,
      // @ts-expect-error - only simple command can set keybinding
      keyBinding: "",
      run: ({ entryId }) => {
        expectTypeOf(entryId).toEqualTypeOf<string>()
      },
    }),
  )
})
