import { IN_ELECTRON } from "@follow/shared/constants"

const OpenInBrowser = (_t?: any) =>
  IN_ELECTRON
    ? tShortcuts("command.subscription.open_in_browser.title")
    : tShortcuts("command.subscription.open_in_tab.title")

export const COPY_MAP = {
  OpenInBrowser,
}
