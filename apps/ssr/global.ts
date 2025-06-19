import { name } from "../../package.json"

export const defineGlobalConstants = () => {
  Object.assign(globalThis, {
    APP_NAME: name,
  })
}
