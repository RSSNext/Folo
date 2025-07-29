import { assertType, test } from "vitest"

import { COMMAND_ID } from "../commands/id"
import { useCommandHotkey } from "./use-register-hotkey"

test("useRegisterHotkey types", () => {
  assertType(
    useCommandHotkey({
      shortcut: "",
      commandId: COMMAND_ID.entry.openInBrowser,
      args: [{ entryId: "" }],
    }),
  )

  assertType(
    useCommandHotkey({
      shortcut: "",
      commandId: COMMAND_ID.entry.openInBrowser,
      // @ts-expect-error - missing required options
      args: [],
    }),
  )

  assertType(
    useCommandHotkey({
      shortcut: "",
      commandId: COMMAND_ID.entry.openInBrowser,
      // @ts-expect-error - invalid args type
      args: [1],
    }),
  )

  assertType(
    useCommandHotkey({
      shortcut: "",
      commandId: COMMAND_ID.entry.openInBrowser,
      // @ts-expect-error - invalid args number
      args: ["", ""],
    }),
  )

  assertType(
    useCommandHotkey({
      shortcut: "",
      // @ts-expect-error - invalid command id
      commandId: "unknown command",
    }),
  )
})
