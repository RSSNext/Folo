import { assertType, test } from "vitest"

import { CommandActionButton, CommandIdButton } from "./command-button"
import type { OpenInBrowserCommand, TipCommand } from "./commands/entry"
import { COMMAND_ID } from "./commands/id"

test("CommandActionButton types", () => {
  const mockCommand = {} as OpenInBrowserCommand
  assertType(
    CommandActionButton({
      command: mockCommand,
      args: [{ entryId: "" }],
    }),
  )

  assertType(
    CommandActionButton({
      command: {} as TipCommand,
      args: [
        {
          feedId: "",
          // @ts-expect-error - invalid entryId type
          entryId: false,
        },
      ],
    }),
  )

  assertType(
    CommandActionButton({
      command: mockCommand,
      // @ts-expect-error - missing required options
      args: [],
    }),
  )

  assertType(
    CommandActionButton({
      command: mockCommand,
      // @ts-expect-error - invalid args type
      args: [1],
    }),
  )

  assertType(
    CommandActionButton({
      command: mockCommand,
      // @ts-expect-error - redundant args
      args: ["", ""],
    }),
  )

  assertType(
    CommandActionButton({
      command: mockCommand,
      // @ts-expect-error - invalid args type
      args: [{}],
    }),
  )

  assertType(
    CommandActionButton({
      command: mockCommand,
      // @ts-expect-error - invalid args type
      args: [""],
    }),
  )
})

test("CommandIdButton types", () => {
  const commandId = COMMAND_ID.entry.openInBrowser
  assertType(
    CommandIdButton({
      commandId,
      args: [{ entryId: "" }],
    }),
  )

  assertType(
    CommandIdButton({
      commandId,
      // @ts-expect-error - missing required options
      args: [],
    }),
  )

  assertType(
    CommandIdButton({
      commandId,
      // @ts-expect-error - invalid args type
      args: [1],
    }),
  )

  assertType(
    CommandIdButton({
      commandId,
      // @ts-expect-error - invalid args type
      args: [{}],
    }),
  )

  assertType(
    CommandIdButton({
      commandId,
      // @ts-expect-error - invalid args type
      args: [""],
    }),
  )

  assertType(
    CommandIdButton({
      commandId,
      // @ts-expect-error - redundant args
      args: ["", ""],
    }),
  )
})
