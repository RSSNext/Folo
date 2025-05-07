import { useEventListener } from "usehooks-ts"

export const useAnyPointDown = (handler: (event: PointerEvent) => void) => {
  useEventListener("pointerdown", (event) => {
    handler(event)
  })
}
