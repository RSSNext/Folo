import type { RSSHubParameter, RSSHubParameterObject } from "@follow/models/rsshub"

export const normalizeRSSHubParameters = (
  parameters: RSSHubParameter,
): RSSHubParameterObject | null =>
  parameters
    ? typeof parameters === "string"
      ? { description: parameters, default: null }
      : parameters
    : null
