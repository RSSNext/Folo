import type { OtaPlatform, OtaRelease } from "./schema"

export function compareSemver(left: string, right: string) {
  const leftParts = left.split(".").map(Number)
  const rightParts = right.split(".").map(Number)

  for (let index = 0; index < 3; index += 1) {
    const diff = leftParts[index]! - rightParts[index]!
    if (diff !== 0) {
      return diff
    }
  }

  return 0
}

export function selectLatestCompatibleRelease(
  releases: OtaRelease[],
  input: {
    product: OtaRelease["product"]
    channel: OtaRelease["channel"]
    runtimeVersion: OtaRelease["runtimeVersion"]
    platform: OtaPlatform
  },
) {
  return (
    releases
      .filter((release) => release.product === input.product)
      .filter((release) => release.channel === input.channel)
      .filter((release) => release.releaseKind === "ota")
      .filter((release) => release.runtimeVersion === input.runtimeVersion)
      .filter((release) => Boolean(release.platforms[input.platform]))
      .sort((left, right) => compareSemver(right.releaseVersion, left.releaseVersion))[0] ?? null
  )
}
