import { assertType, expectTypeOf, test } from "vitest"

import { COMMAND_ID } from "../commands/id"
import { useRegisterFollowCommand } from "./use-register-command"

test("useRegisterFollowCommand types", () => {
  assertType(
    useRegisterFollowCommand({
      id: COMMAND_ID.entry.openInBrowser,
      label: "",
      run: ({ entryId }) => {
        expectTypeOf(entryId).toEqualTypeOf<string>()
      },
    }),
  )

  assertType(
    useRegisterFollowCommand({
      id: "unknown id",
      label: "",
      run: (...args) => {
        expectTypeOf(args).toEqualTypeOf<[]>()
      },
    }),
  )

  assertType(
    useRegisterFollowCommand([
      {
        id: COMMAND_ID.entry.star,
        label: "",
        run: ({ entryId }) => {
          expectTypeOf(entryId).toEqualTypeOf<string>()
        },
      },
    ]),
  )

  assertType(
    useRegisterFollowCommand([
      {
        id: "unknown id",
        label: "",
        run: (...args) => {
          expectTypeOf(args).toEqualTypeOf<[]>()
        },
      },
    ]),
  )

  assertType(
    useRegisterFollowCommand([
      {
        id: "unknown id",
        label: "",
        run: (...args) => {
          expectTypeOf(args).toEqualTypeOf<[]>()
        },
      },
      {
        id: COMMAND_ID.entry.star,
        label: "",
        run: ({ entryId }) => {
          expectTypeOf(entryId).toEqualTypeOf<string>()
        },
      },
    ]),
  )
})
