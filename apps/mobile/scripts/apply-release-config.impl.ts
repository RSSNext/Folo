import { readFile, writeFile } from "node:fs/promises"

import { join } from "pathe"

const semverPattern = /^\d+\.\d+\.\d+$/

export interface ReleasePlan {
  mode: "store" | "ota"
  runtimeVersion: string | null
  channel: "production" | "preview" | null
}

export async function applyReleaseConfig(input: { projectDir: string; version: string }) {
  if (!input.version || !semverPattern.test(input.version)) {
    throw new Error("Expected a plain x.y.z version argument")
  }

  const releasePlanPath = join(input.projectDir, "release-plan.json")
  const releaseConfigPath = join(input.projectDir, "release.json")
  const plan = await readReleasePlan(releasePlanPath)
  validateReleasePlan(plan)

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

async function readReleasePlan(path: string): Promise<ReleasePlan> {
  return JSON.parse(await readFile(path, "utf8")) as ReleasePlan
}

function validateReleasePlan(plan: ReleasePlan) {
  if (plan.mode !== "store" && plan.mode !== "ota") {
    throw new Error("release-plan.json mode must be store or ota")
  }

  if (plan.mode === "store") {
    return
  }

  if (!plan.runtimeVersion || !semverPattern.test(plan.runtimeVersion)) {
    throw new Error("release-plan.json runtimeVersion must be a plain x.y.z version")
  }

  if (plan.channel !== "production" && plan.channel !== "preview") {
    throw new Error("release-plan.json channel must be production or preview")
  }
}

export function createDefaultReleasePlan(): ReleasePlan {
  return {
    mode: "store",
    runtimeVersion: null,
    channel: null,
  }
}
