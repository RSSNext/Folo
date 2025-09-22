import * as Sentry from "@sentry/react-native"

export const initializeSentry = () => {
  // Unlike Sentry on other platforms, you do not need to import anything to use tracing on React Native
  Sentry.init({
    dsn: "https://cbfecd786e09a9481676655a4da88a7e@o4507542488023040.ingest.us.sentry.io/4509926421102593",
    // We recommend adjusting this value in production, or using tracesSampler
    // for finer control
    tracesSampleRate: 1,
  })
}
