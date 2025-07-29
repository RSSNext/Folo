import type { defaultNS, ns } from "./constants"
import type { defaultResources as resources } from "./default-resource"

declare module "i18next" {
  interface CustomTypeOptions {
    // ns: ["app", "common", "external", "lang", "settings", "shortcuts"]
    ns: typeof ns
    resources: (typeof resources)["en"]
    defaultNS: typeof defaultNS
    // if you see an error like: "Argument of type 'DefaultTFuncReturn' is not assignable to parameter of type xyz"
    // set returnNull to false (and also in the i18next init options)
    // returnNull: false;
  }
}
