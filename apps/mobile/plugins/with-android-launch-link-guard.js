const { withMainActivity } = require("expo/config-plugins")

const { mergeContents } = require("./merge-contents")

// Android recreates an app it killed in the background from the intent that first opened its
// task, and so does a launch from the recent apps. When that intent was a link, React Native
// reports it as the launch link again, and the app would open the link once more. A link that
// starts a fresh task arrives without saved state and without the history flag, so it still works.
const GUARD = `    // The link that opened this task was handled when it came in; drop it from a restore
    if (savedInstanceState != null ||
        (intent.flags and android.content.Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY) != 0) {
      intent.data = null
    }`

/** Clears the replayed launch link in `MainActivity.onCreate`, before React Native reads it */
const addLaunchLinkGuard = (contents) =>
  mergeContents({
    src: contents,
    anchor: /super\.onCreate\(/,
    // Before the call, as the activity hands the intent on from there
    offset: -1,
    newSrc: GUARD,
    tag: "folo-launch-link-guard",
    comment: "    //",
  }).contents

const withAndroidLaunchLinkGuard = (config) =>
  withMainActivity(config, (config) => {
    if (config.modResults.language !== "kt") {
      throw new Error("withAndroidLaunchLinkGuard expects a Kotlin MainActivity")
    }
    config.modResults.contents = addLaunchLinkGuard(config.modResults.contents)
    return config
  })

module.exports = withAndroidLaunchLinkGuard
module.exports.addLaunchLinkGuard = addLaunchLinkGuard
