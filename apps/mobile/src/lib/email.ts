import { z } from "zod"

// The auth server checks addresses with zod's email format, so an address it would reject is
// caught before the request is sent
const emailSchema = z.email()

export const isValidEmail = (email: string) => emailSchema.safeParse(email).success
