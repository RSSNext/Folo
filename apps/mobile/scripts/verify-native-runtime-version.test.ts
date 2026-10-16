import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"

import { dirname, join } from "pathe"
import { afterEach, describe, expect, it } from "vitest"

import { verifyNativeRuntimeVersion } from "./verify-native-runtime-version.impl"

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  )
})

const createProject = async (files: Record<string, string>) => {
  const projectDir = await mkdtemp(join(tmpdir(), "verify-native-runtime-version-test-"))
  tempDirs.push(projectDir)

  await writeFile(join(projectDir, "package.json"), JSON.stringify({ version: "0.6.1" }), "utf8")
  for (const [path, content] of Object.entries(files)) {
    await mkdir(dirname(join(projectDir, path)), { recursive: true })
    await writeFile(join(projectDir, path), content, "utf8")
  }

  return projectDir
}

const androidStrings = (runtimeVersion: string) => `<resources>
  <string name="app_name">Folo</string>
  <string name="expo_runtime_version">${runtimeVersion}</string>
</resources>
`

const expoPlist = (runtimeVersion: string) => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>EXUpdatesRuntimeVersion</key>
    <string>${runtimeVersion}</string>
  </dict>
</plist>
`

const androidStringsPath = "android/app/src/main/res/values/strings.xml"
const expoPlistPath = "ios/Folo/Supporting/Expo.plist"

describe("verifyNativeRuntimeVersion", () => {
  it("accepts an Android release build that embeds the package version", async () => {
    const projectDir = await createProject({ [androidStringsPath]: androidStrings("0.6.1") })

    await expect(
      verifyNativeRuntimeVersion({
        projectDir,
        platform: "android",
        profile: "production",
        nodeEnv: undefined,
      }),
    ).resolves.toBe("0.6.1")
  })

  it("rejects an Android release build that embeds the development runtime", async () => {
    const projectDir = await createProject({ [androidStringsPath]: androidStrings("0.0.0-dev") })

    await expect(
      verifyNativeRuntimeVersion({
        projectDir,
        platform: "android",
        profile: "preview",
        nodeEnv: undefined,
      }),
    ).rejects.toThrow(/has runtime version 0\.0\.0-dev, expected 0\.6\.1/)
  })

  it("expects the development runtime for development client builds", async () => {
    const projectDir = await createProject({ [androidStringsPath]: androidStrings("0.0.0-dev") })

    await expect(
      verifyNativeRuntimeVersion({
        projectDir,
        platform: "android",
        profile: "development",
        nodeEnv: undefined,
      }),
    ).resolves.toBe("0.0.0-dev")
  })

  it("treats a build without a profile as a release build", async () => {
    const projectDir = await createProject({ [androidStringsPath]: androidStrings("0.0.0-dev") })

    await expect(
      verifyNativeRuntimeVersion({
        projectDir,
        platform: "android",
        profile: undefined,
        nodeEnv: undefined,
      }),
    ).rejects.toThrow(/expected 0\.6\.1/)
  })

  it("checks Expo.plist for iOS builds", async () => {
    const projectDir = await createProject({ [expoPlistPath]: expoPlist("0.6.1") })

    await expect(
      verifyNativeRuntimeVersion({
        projectDir,
        platform: "ios",
        profile: "preview",
        nodeEnv: undefined,
      }),
    ).resolves.toBe("0.6.1")
  })

  it("rejects a native project without a runtime version", async () => {
    const projectDir = await createProject({ [expoPlistPath]: "<plist><dict></dict></plist>" })

    await expect(
      verifyNativeRuntimeVersion({
        projectDir,
        platform: "ios",
        profile: "production",
        nodeEnv: undefined,
      }),
    ).rejects.toThrow(/has runtime version \(missing\)/)
  })

  it("rejects an unknown platform", async () => {
    const projectDir = await createProject({})

    await expect(
      verifyNativeRuntimeVersion({
        projectDir,
        platform: undefined,
        profile: "production",
        nodeEnv: undefined,
      }),
    ).rejects.toThrow(/EAS_BUILD_PLATFORM/)
  })
})
