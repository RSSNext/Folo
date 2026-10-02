import { installGlobalFetchTracking } from "../lib/network-activity"

// Expo's winter runtime (run by Metro before the main module) installs `expo/fetch` as the global
// `fetch`. Wrap it so a runtime reload can wait for every request to settle (see `reload-app.ts`).
installGlobalFetchTracking()
