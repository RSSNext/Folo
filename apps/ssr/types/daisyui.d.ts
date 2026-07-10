declare module "daisyui" {
  import type { Config } from "tailwindcss"

  const daisyui: NonNullable<Config["plugins"]>[number]
  export default daisyui
}
