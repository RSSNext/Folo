import { useImagesStore } from "./store"

const get = useImagesStore.getState

export const getImageInfo = (url: string) => {
  return get().images[url]
}
