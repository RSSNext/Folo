import i18next from "i18next"
import { z } from "zod"

export const socialLinksSchema = z.object({
  twitter: z.string().max(32).optional(),
  github: z.string().max(32).optional(),
  instagram: z.string().max(32).optional(),
  facebook: z.string().max(32).optional(),
  youtube: z.string().max(32).optional(),
  discord: z.string().max(32).optional(),
})

// The sizes of the user table's columns, which the server checks before it saves a profile
const MAX_LENGTH = {
  handle: 36,
  name: 64,
  image: 256,
  bio: 256,
  website: 256,
} as const

export type ProfileTextField = keyof typeof MAX_LENGTH

const tooLongMessage = (field: ProfileTextField) =>
  i18next.t("validation.too_long", { ns: "common", count: MAX_LENGTH[field] })

// Counted as the server counts them, so an emoji is one character and not two UTF-16 units
const withMaxLength = (schema: z.ZodString, field: ProfileTextField) =>
  schema.refine((value) => [...value].length <= MAX_LENGTH[field], {
    error: () => tooLongMessage(field),
  })

const invalidHandleMessage = () => i18next.t("profile.handle.invalid", { ns: "settings" })

const HANDLE_PATTERN = /^\w+$/

/**
 * The profile form's schema. `storedHandle` is the user's handle: older clients saved handles
 * with spaces or other characters, which the server keeps when a save sends them back, so the
 * handle's format is checked only once the user changes it.
 */
export const createProfileFormSchema = (storedHandle?: string | null) =>
  z.object({
    handle: withMaxLength(
      z.string().refine((handle) => handle === storedHandle || HANDLE_PATTERN.test(handle), {
        error: invalidHandleMessage,
      }),
      "handle",
    )
      .optional()
      .or(z.literal("")),
    name: withMaxLength(z.string().trim().min(1), "name"),
    image: withMaxLength(z.string().url(), "image").or(z.literal("")).optional(),
    bio: withMaxLength(z.string(), "bio").optional(),
    website: withMaxLength(z.string().url(), "website").optional().or(z.literal("")),
    socialLinks: socialLinksSchema.optional(),
  })

export type ProfileFormValues = z.infer<ReturnType<typeof createProfileFormSchema>>

// The codes the server's update-user answers a field it refuses with
const SERVER_FIELD_ERRORS: Record<string, { field: ProfileTextField; message: () => string }> = {
  HANDLE_ALREADY_TAKEN: {
    field: "handle",
    message: () => i18next.t("profile.handle.taken", { ns: "settings" }),
  },
  // Spaces or invisible characters in a handle; the form's own check refuses them first
  HANDLE_INVALID_CHARACTERS: { field: "handle", message: invalidHandleMessage },
  NAME_CANNOT_BE_EMPTY: {
    field: "name",
    message: () => i18next.t("validation.required", { ns: "common" }),
  },
  HANDLE_TOO_LONG: { field: "handle", message: () => tooLongMessage("handle") },
  NAME_TOO_LONG: { field: "name", message: () => tooLongMessage("name") },
  IMAGE_TOO_LONG: { field: "image", message: () => tooLongMessage("image") },
  BIO_TOO_LONG: { field: "bio", message: () => tooLongMessage("bio") },
  WEBSITE_TOO_LONG: { field: "website", message: () => tooLongMessage("website") },
}

/** The form field and message for an update-user error code that names a refused field */
export const getProfileFieldError = (code: string | undefined) => {
  const fieldError = code && Object.hasOwn(SERVER_FIELD_ERRORS, code) && SERVER_FIELD_ERRORS[code]
  return fieldError ? { field: fieldError.field, message: fieldError.message() } : undefined
}
