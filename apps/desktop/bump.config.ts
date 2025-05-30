/* eslint-disable no-template-curly-in-string */
import { defineConfig } from "nbump"

export default defineConfig({
  leading: [
    "git pull --rebase",
    "tsx scripts/apply-changelog.ts ${NEW_VERSION}",
    "git add changelog",
    "tsx plugins/vite/generate-main-hash.ts",
    "pnpm eslint --fix package.json",
    "pnpm prettier --ignore-unknown --write package.json",
    "git add package.json",
  ],
  trailing: ["git checkout -b release/desktop/${NEW_VERSION}"],
  finally: [
    "git push origin release/desktop/${NEW_VERSION}",
    "gh pr create --title 'release(desktop): Release v${NEW_VERSION}' --body 'v${NEW_VERSION}' --base main --head release/desktop/${NEW_VERSION}",
  ],
  push: false,
  commitMessage: "release(desktop): release v${NEW_VERSION}",
  tagPrefix: "desktop@",
  changelog: false,
  allowedBranches: ["dev"],
})
