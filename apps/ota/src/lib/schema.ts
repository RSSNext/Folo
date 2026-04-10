import { z } from "zod"

const semver = z.string().regex(/^\d+\.\d+\.\d+$/)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/)
const otaPlatforms = ["ios", "android", "macos", "windows", "linux"] as const

export const otaPlatformSchema = z.enum(otaPlatforms)

const assetSchema = z.object({
  path: z.string().min(1),
  sha256,
  contentType: z.string().min(1),
})

const platformSchema = z.object({
  launchAsset: assetSchema,
  assets: z.array(assetSchema),
})

const platformsSchema = z
  .object({
    ios: platformSchema.optional(),
    android: platformSchema.optional(),
    macos: platformSchema.optional(),
    windows: platformSchema.optional(),
    linux: platformSchema.optional(),
  })
  .strict()
  .refine((platforms) => Object.keys(platforms).length > 0, {
    message: "At least one platform must be provided",
  })

export const otaReleaseSchema = z.object({
  schemaVersion: z.literal(1),
  product: z.enum(["mobile", "desktop"]),
  channel: z.string().min(1),
  releaseVersion: semver,
  releaseKind: z.enum(["ota", "store"]),
  runtimeVersion: semver,
  publishedAt: z.string().datetime(),
  git: z.object({
    tag: z.string().min(1),
    commit: z.string().min(7),
  }),
  policy: z.object({
    storeRequired: z.boolean(),
    minSupportedBinaryVersion: semver,
    message: z.string().nullable(),
  }),
  platforms: platformsSchema,
})

export type OtaPlatform = z.infer<typeof otaPlatformSchema>
export type OtaRelease = z.infer<typeof otaReleaseSchema>
