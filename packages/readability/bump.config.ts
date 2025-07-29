import { defineConfig } from "nbump"

export default defineConfig({
  leading: ["npm run build"],
  tag: false,
  push: false,
  commit: false,
  allowDirty: true,
  changelog: false,
  publish: true,
  allowedBranches: ["dev"],
})
