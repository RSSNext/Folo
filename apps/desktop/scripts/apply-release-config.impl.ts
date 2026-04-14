import { readFile, writeFile } from "node:fs/promises"

import { join } from "pathe"

const semverPattern = /^\d+\.\d+\.\d+$/
const validModes = new Set(["build", "ota"])
const validChannels = new Set(["stable", "beta", "alpha"])

export interface DesktopReleasePlan {
  mode: "build" | "ota"
  runtimeVersion: string | null
  channel: "stable" | "beta" | "alpha" | null
}

interface DesktopPackageJson {
  runtimeVersion?: string
  version: string
  [key: string]: unknown
}

export async function applyReleaseConfig(input: { projectDir: string; version: string }) {
  if (!input.version || !semverPattern.test(input.version)) {
    throw new Error("Expected a plain x.y.z version argument")
  }

  const releasePlanPath = join(input.projectDir, "release-plan.json")
  const releaseConfigPath = join(input.projectDir, "release.json")
  const packageJsonPath = join(input.projectDir, "package.json")
  const plan = await readReleasePlan(releasePlanPath)
  validateReleasePlan(plan)

  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as DesktopPackageJson
  packageJson.runtimeVersion = plan.mode === "ota" ? plan.runtimeVersion! : input.version

  await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8")
  await writeFile(
    releaseConfigPath,
    `${JSON.stringify(
      {
        version: input.version,
        ...plan,
      },
      null,
      2,
    )}\n`,
    "utf8",
  )
  await writeFile(
    releasePlanPath,
    `${JSON.stringify(createDefaultReleasePlan(), null, 2)}\n`,
    "utf8",
  )
}

async function readReleasePlan(path: string): Promise<DesktopReleasePlan> {
  return JSON.parse(await readFile(path, "utf8")) as DesktopReleasePlan
}

function validateReleasePlan(plan: DesktopReleasePlan) {
  if (!validModes.has(plan.mode)) {
    throw new Error("release-plan.json mode must be build or ota")
  }

  if (plan.channel !== null && !validChannels.has(plan.channel)) {
    throw new Error("release-plan.json channel must be stable, beta, alpha, or null")
  }

  if (plan.mode === "build") {
    if (plan.runtimeVersion !== null || plan.channel !== null) {
      throw new Error("desktop build mode must not set runtimeVersion or channel")
    }
    return
  }

  if (plan.mode === "ota") {
    if (!plan.runtimeVersion || !semverPattern.test(plan.runtimeVersion)) {
      throw new Error("desktop ota mode requires a plain x.y.z runtimeVersion")
    }
    if (!plan.channel) {
      throw new Error("desktop ota mode requires a channel")
    }
  }
}

export function createDefaultReleasePlan(): DesktopReleasePlan {
  return {
    mode: "build",
    runtimeVersion: null,
    channel: null,
  }
}
