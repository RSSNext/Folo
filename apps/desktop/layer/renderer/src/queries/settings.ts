import { followClient } from "~/lib/api-client"
import { defineQuery } from "~/lib/defineQuery"

export const settings = {
  get: () => defineQuery(["settings"], async () => await followClient.api.settings.get()),
}
