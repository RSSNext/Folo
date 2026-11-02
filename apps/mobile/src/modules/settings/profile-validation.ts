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
 * What a new or changed handle is made of, as on desktop and the server: A-Z, a-z, 0-9 and _ only,
 * which \w is without the u flag. With it and the i flag, \w would also take K and ſ look-alikes.
 */
const HANDLE_PATTERN = /^\w+$/

// Counted as the server counts them, so an emoji is one character and not two UTF-16 units
const countCharacters = (value: string) => Array.from(value).length

const tooLongMessage = (field: ProfileTextField) =>
  t("validation.too_long", { ns: "common", count: MAX_LENGTH[field] })

const invalidHandleMessage = () => t("profile.handle.invalid", { ns: "settings" })

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
  // A blank handle saves as no handle
  if (field === "handle" && text && text !== storedHandle?.trim() && !HANDLE_PATTERN.test(text)) {
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
  // Spaces or invisible characters in a new handle, and any other character than A-Z, a-z, 0-9
  // and _; the check above refuses both first
  ["HANDLE_INVALID_CHARACTERS", { field: "handle", message: invalidHandleMessage }],
  ["HANDLE_INVALID", { field: "handle", message: invalidHandleMessage }],
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
