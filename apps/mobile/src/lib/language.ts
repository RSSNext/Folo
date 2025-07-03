import type { languageSchema } from "@follow/shared/hono"
import type { z } from "zod"

export type SupportedLanguages = z.infer<typeof languageSchema>
