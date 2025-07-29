import type { UserSchema } from "@follow/database/schemas/types"

export interface UserProfileEditable {
  email: string
  name: string
  handle: string
  image: string
  bio?: string
  website?: string
  socialLinks?: UserSchema["socialLinks"]
}
