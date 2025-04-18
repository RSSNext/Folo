/* eslint-disable no-template-curly-in-string */
import { defineConfig } from "nbump"

export default defineConfig({
  leading: [
    "git pull --rebase",
    "tsx scripts/apply-changelog.ts ${NEW_VERSION}",
    "git add changelog",
    "pnpm eslint --fix package.json",
    "pnpm prettier --ignore-unknown --write package.json",
    "git add package.json",
  ],
  trailing: ["git checkout -b release/mobile/${NEW_VERSION}"],
  finally: [
    "git push origin release/mobile/${NEW_VERSION}",
    "gh pr create --title 'release(mobile): Release v${NEW_VERSION}' --body 'v${NEW_VERSION}' --base main --head release/mobile/${NEW_VERSION}",
  ],
  push: false,
  commitMessage: "release(mobile): release v${NEW_VERSION}",
  tagPrefix: "mobile@",
  changelog: false,
  allowedBranches: ["dev"],
})
