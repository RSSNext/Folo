import { defineProject } from "vitest/config"

export default defineProject({
  test: {
    environment: "node",
  },
  define: {
    ELECTRON: "false",
    APP_VERSION: JSON.stringify("0.0.0"),
  },
})
