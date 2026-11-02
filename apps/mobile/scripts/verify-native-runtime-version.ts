import { fileURLToPath } from "node:url"

import { dirname } from "pathe"

import { verifyNativeRuntimeVersion } from "./verify-native-runtime-version.impl"

// Runs as the eas-build-post-install hook, after EAS generated or synced the native project.
const projectDir = dirname(dirname(fileURLToPath(import.meta.url)))

async function main() {
  const runtimeVersion = await verifyNativeRuntimeVersion({
    projectDir,
    platform: process.env.EAS_BUILD_PLATFORM,
    profile: process.env.PROFILE,
    nodeEnv: process.env.NODE_ENV,
  })

  console.info(`Native runtime version: ${runtimeVersion}`)
}

void main()
