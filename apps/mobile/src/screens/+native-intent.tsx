// Redirects to the home screen when the app is opened with a deep link.
// Test this by running the following command in the terminal:
// pnpx uri-scheme open 'follow://add?id=1' --ios
//
// See https://docs.expo.dev/router/advanced/native-intent/#rewrite-incoming-native-deep-links

import { resetIntentUrl } from "../hooks/useIntentHandler"

export function redirectSystemPath(_options: { path: string; initial: boolean }) {
  resetIntentUrl()
  return "/"
}
