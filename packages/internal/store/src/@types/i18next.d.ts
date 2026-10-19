import type { defaultResources as resources } from "./default-resource"

declare module "i18next" {
  interface CustomTypeOptions {
    ns: ["settings", "common"]
    resources: (typeof resources)["en"]
    defaultNS: "settings"
  }
}
