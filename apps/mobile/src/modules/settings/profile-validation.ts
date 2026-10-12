import { t } from "i18next"

// The sizes of the user table's columns, which the server checks before it saves a profile
const MAX_LENGTH = {
  name: 64,
  handle: 36,
  image: 256,
  bio: 256,
  website: 256,
} as const

export type ProfileTextField = keyof typeof MAX_LENGTH

/**
 * Characters the server refuses in a new handle, as they cannot be seen or space it out: control
 * and format characters, the other characters that render as nothing, and whitespace.
 */
const HANDLE_INVALID_CHARACTER =
  /[\p{Cc}\p{Cf}\p{Default_Ignorable_Code_Point}\p{White_Space}\u2800]/u

// Counted as the server counts them, so an emoji is one character and not two UTF-16 units
const countCharacters = (value: string) => Array.from(value).length

const tooLongMessage = (field: ProfileTextField) =>
  t("validation.too_long", { ns: "common", count: MAX_LENGTH[field] })

// Says what is refused. Desktop's message asks for letters, numbers and underscores only, which
// its stricter check requires but this one, like the server, does not
const invalidHandleMessage = () => t("profile.handle.invalid_characters", { ns: "settings" })

/**
 * Why the server would refuse a profile field's value, as a translated message. The name and the
 * handle are checked trimmed, as they are saved. `storedHandle` is the user's handle: older clients
 * saved handles with spaces or other characters, which keep saving until the user changes them.
 */
export const getProfileFieldError = (
  field: ProfileTextField,
  value: string,
  storedHandle?: string | null,
): string | undefined => {
  const text = field === "name" || field === "handle" ? value.trim() : value

  if (field === "name" && !text) {
    return t("validation.required", { ns: "common" })
  }
  if (field === "handle" && text !== storedHandle?.trim() && HANDLE_INVALID_CHARACTER.test(text)) {
    return invalidHandleMessage()
  }
  if (countCharacters(text) > MAX_LENGTH[field]) {
    return tooLongMessage(field)
  }
  return undefined
}

// The codes the server's update-user answers a field it refuses with
const SERVER_FIELD_ERRORS = new Map<string, { field: ProfileTextField; message: () => string }>([
  [
    "HANDLE_ALREADY_TAKEN",
    { field: "handle", message: () => t("profile.handle.taken", { ns: "settings" }) },
  ],
  ["HANDLE_INVALID_CHARACTERS", { field: "handle", message: invalidHandleMessage }],
  [
    "NAME_CANNOT_BE_EMPTY",
    { field: "name", message: () => t("validation.required", { ns: "common" }) },
  ],
  ["NAME_TOO_LONG", { field: "name", message: () => tooLongMessage("name") }],
  ["HANDLE_TOO_LONG", { field: "handle", message: () => tooLongMessage("handle") }],
  ["IMAGE_TOO_LONG", { field: "image", message: () => tooLongMessage("image") }],
  ["BIO_TOO_LONG", { field: "bio", message: () => tooLongMessage("bio") }],
  ["WEBSITE_TOO_LONG", { field: "website", message: () => tooLongMessage("website") }],
])

/** The field and translated message for an update-user error code that names a refused field */
export const getServerProfileFieldError = (code: string | undefined) => {
  const fieldError = code ? SERVER_FIELD_ERRORS.get(code) : undefined
  return fieldError ? { field: fieldError.field, message: fieldError.message() } : undefined
}
