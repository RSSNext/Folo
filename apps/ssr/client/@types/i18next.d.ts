import type { defaultNS, ns } from "./constants"
import type { defaultResources as resources } from "./default-resource"

declare module "i18next" {
  interface CustomTypeOptions {
    ns: typeof ns
    resources: (typeof resources)["en"]
    defaultNS: typeof defaultNS
  }
}
