import { z } from "zod"

const otaPlatforms = ["ios", "android", "macos", "windows", "linux"] as const
const semver = z.string().regex(/^\d+\.\d+\.\d+$/)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/)

const assetSchema = z.object({
  path: z.string().min(1),
  sha256,
  contentType: z.string().min(1),
})

const platformSchema = z.object({
  launchAsset: assetSchema,
  assets: z.array(assetSchema),
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
  platforms: z.record(z.string(), platformSchema).superRefine((platforms, ctx) => {
    for (const platform of Object.keys(platforms)) {
      if (!otaPlatforms.includes(platform as (typeof otaPlatforms)[number])) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [platform],
          message: `Unsupported platform: ${platform}`,
        })
      }
    }
  }),
})
