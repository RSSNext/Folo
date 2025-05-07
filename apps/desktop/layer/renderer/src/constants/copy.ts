import { IN_ELECTRON } from "@follow/shared/constants"

const OpenInBrowser = (_t?: any) =>
  IN_ELECTRON ? "keys.entry.openInBrowser" : "keys.entry.openInNewTab"

export const COPY_MAP = {
  OpenInBrowser,
}
