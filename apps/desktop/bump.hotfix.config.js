/* eslint-disable no-template-curly-in-string */
import { execSync } from "node:child_process"

import { defineConfig } from "nbump"

const currentBranch = execSync("git rev-parse --abbrev-ref HEAD").toString().trim()

export default defineConfig({
  before: ["git pull --rebase"],
  after: [
    `gh pr create --title 'chore(desktop): Release v\${NEW_VERSION} for hotfix' --body 'v\${NEW_VERSION}' --base main --head ${currentBranch}`,
  ],
  commit_message: "release(desktop): hotfix to release v${NEW_VERSION}",
  tag: false,
  changelog: false,
  allowedBranches: ["hotfix/*"],
})
