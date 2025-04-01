import type { Galeria as GaleriaInterface } from "./index.ios"

const Galeria: typeof GaleriaInterface = Object.assign(
  () => {
    return null
  },
  {
    Image: () => null,
  },
) as unknown as typeof GaleriaInterface

export { Galeria }
