import type { RSSHubParameter, RSSHubParameterObject } from "./types"

export const normalizeRSSHubParameters = (
  parameters: RSSHubParameter,
): RSSHubParameterObject | null =>
  parameters
    ? typeof parameters === "string"
      ? { description: parameters, default: null }
      : parameters
    : null
