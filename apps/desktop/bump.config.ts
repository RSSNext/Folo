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

  push: true,
  commitMessage: "release(desktop): release v${NEW_VERSION}",
  tag: false,
  allowDirty: true,
  changelog: false,
  allowedBranches: ["dev", "main"],
})
