import { z } from "zod"

const semver = z.string().regex(/^\d+\.\d+\.\d+$/)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/)
const sha512 = z.string().regex(/^[A-Z0-9+/=]+$/i)

const assetSchema = z.object({
  path: z.string().min(1),
  sha256,
  contentType: z.string().min(1),
})

const platformAssetSchema = z.object({
  launchAsset: assetSchema,
  assets: z.array(assetSchema),
})

const projectedPlatformsSchema = z
  .object({
    ios: platformAssetSchema.optional(),
    android: platformAssetSchema.optional(),
    macos: platformAssetSchema.optional(),
    windows: platformAssetSchema.optional(),
    linux: platformAssetSchema.optional(),
  })
  .strict()

const mobilePolicySchema = z.object({
  storeRequired: z.boolean(),
  minSupportedBinaryVersion: semver,
  message: z.string().nullable(),
})

const mobileReleaseSchema = z
  .object({
    schemaVersion: z.literal(1),
    updateId: z.string().uuid().optional(),
    product: z.literal("mobile"),
    channel: z.string().min(1),
    releaseVersion: semver,
    releaseKind: z.enum(["ota", "store"]),
    runtimeVersion: semver,
    publishedAt: z.string().datetime(),
    git: z.object({
      tag: z.string().min(1),
      commit: z.string().min(7),
    }),
    policy: mobilePolicySchema,
    platforms: projectedPlatformsSchema,
  })
  .superRefine((release, ctx) => {
    if (release.releaseKind === "ota" && !Object.values(release.platforms).some(Boolean)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one platform must be provided",
        path: ["platforms"],
      })
    }
  })

const desktopDistributionSchema = z.enum(["direct", "mas", "mss"])

const desktopPolicyDistributionSchema = z.object({
  downloadUrl: z.string().url().nullable().optional(),
  storeUrl: z.string().url().nullable().optional(),
})

const desktopRendererSchema = z.object({
  version: semver,
  commit: z.string().min(7),
  manifest: z
    .object({
      name: z.string().min(1),
      downloadUrl: z.string().url(),
    })
    .optional(),
  launchAsset: assetSchema,
  assets: z.array(assetSchema),
})

const desktopAppFileSchema = z.object({
  filename: z.string().min(1),
  sha512,
  size: z.number().int().nonnegative(),
  downloadUrl: z.string().url(),
})

const desktopAppPlatformSchema = z.object({
  platform: z.string().min(1),
  releaseDate: z.string().datetime().nullable(),
  manifest: z.object({
    name: z.string().min(1),
    path: z.string().min(1).optional(),
    downloadUrl: z.string().url(),
  }),
  files: z.array(desktopAppFileSchema),
})

const desktopPolicySchema = z.object({
  required: z.boolean(),
  minSupportedBinaryVersion: semver,
  message: z.string().nullable(),
  distributions: z.record(desktopDistributionSchema, desktopPolicyDistributionSchema).default({}),
})

const desktopReleaseInputSchema = z
  .object({
    schemaVersion: z.literal(2),
    updateId: z.string().uuid().optional(),
    product: z.literal("desktop"),
    channel: z.string().min(1),
    releaseVersion: semver,
    releaseKind: z.enum(["ota", "binary", "store"]),
    runtimeVersion: semver.nullable(),
    publishedAt: z.string().datetime(),
    git: z.object({
      tag: z.string().min(1),
      commit: z.string().min(7),
    }),
    policy: desktopPolicySchema,
    desktop: z.object({
      renderer: desktopRendererSchema.nullable(),
      app: z
        .object({
          platforms: z
            .object({
              macos: desktopAppPlatformSchema.optional(),
              windows: desktopAppPlatformSchema.optional(),
              linux: desktopAppPlatformSchema.optional(),
            })
            .strict(),
        })
        .nullable(),
    }),
  })
  .superRefine((release, ctx) => {
    if (release.releaseKind === "ota" && release.runtimeVersion == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Desktop OTA releases require a runtimeVersion",
        path: ["runtimeVersion"],
      })
    }

    if (release.releaseKind === "ota" && release.desktop.renderer == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Desktop OTA releases require renderer payload",
        path: ["desktop", "renderer"],
      })
    }
  })

const desktopReleaseSchema = desktopReleaseInputSchema.transform((release) => ({
  ...release,
  releaseKind: release.releaseKind === "store" ? "binary" : release.releaseKind,
  platforms: projectDesktopPlatforms(release.desktop.renderer),
}))

export const otaReleaseSchema = z.union([mobileReleaseSchema, desktopReleaseSchema])

export type OtaPlatform = "ios" | "android" | "macos" | "windows" | "linux"
export type OtaAsset = z.infer<typeof assetSchema>
export type OtaPlatformPayload = z.infer<typeof platformAssetSchema>
export type OtaProjectedPlatforms = z.infer<typeof projectedPlatformsSchema>
export type MobileOtaRelease = z.infer<typeof mobileReleaseSchema>
export type DesktopOtaRelease = z.infer<typeof desktopReleaseSchema>
export type OtaRelease = z.infer<typeof otaReleaseSchema>
export type DesktopDistribution = z.infer<typeof desktopDistributionSchema>

function projectDesktopPlatforms(
  renderer: z.infer<typeof desktopRendererSchema> | null,
): OtaProjectedPlatforms {
  if (!renderer) {
    return {}
  }

  return {
    macos: {
      launchAsset: renderer.launchAsset,
      assets: renderer.assets,
    },
    windows: {
      launchAsset: renderer.launchAsset,
      assets: renderer.assets,
    },
    linux: {
      launchAsset: renderer.launchAsset,
      assets: renderer.assets,
    },
  }
}
