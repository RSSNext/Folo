import type { languageSchema } from "@follow/shared/src/hono"
import type { z } from "zod"

export type SupportedLanguages = z.infer<typeof languageSchema>
