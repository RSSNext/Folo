import { readFile } from "node:fs/promises"

import { join } from "pathe"

import { isDevelopmentRuntime, resolveRuntimeVersion } from "../app.config.base"

const nativeRuntimeVersionSources = {
  android: {
    path: "android/app/src/main/res/values/strings.xml",
    pattern: /<string name="expo_runtime_version">([^<]*)<\/string>/,
  },
  ios: {
    path: "ios/Folo/Supporting/Expo.plist",
    pattern: /<key>EXUpdatesRuntimeVersion<\/key>\s*<string>([^<]*)<\/string>/,
  },
}

export async function verifyNativeRuntimeVersion(input: {
  projectDir: string
  platform: string | undefined
  profile: string | undefined
  nodeEnv: string | undefined
}) {
  if (input.platform !== "android" && input.platform !== "ios") {
    throw new Error(`Expected EAS_BUILD_PLATFORM to be android or ios, got ${input.platform}`)
  }

  const source = nativeRuntimeVersionSources[input.platform]
  const nativeConfig = await readFile(join(input.projectDir, source.path), "utf8")
  const nativeRuntimeVersion = nativeConfig.match(source.pattern)?.[1] ?? null
  const packageJsonPath = join(input.projectDir, "package.json")
  const { version } = JSON.parse(await readFile(packageJsonPath, "utf8")) as { version: string }
  // No OTA_RUNTIME_VERSION here: OTA releases take their runtime from the binary version.
  const expectedRuntimeVersion = resolveRuntimeVersion({
    isDevelopment: isDevelopmentRuntime({ profile: input.profile, nodeEnv: input.nodeEnv }),
    packageVersion: version,
  })

  if (nativeRuntimeVersion !== expectedRuntimeVersion) {
    throw new Error(
      `${source.path} has runtime version ${nativeRuntimeVersion ?? "(missing)"}, expected ${expectedRuntimeVersion} for build profile ${input.profile ?? "(unset)"}. This binary would never match the OTA updates published for its version.`,
    )
  }

  return nativeRuntimeVersion
}
