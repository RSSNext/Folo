import { createEventBus } from "@follow/utils/event-bus"

export const ModalEventBus = createEventBus<{
  DISMISS: ModalDisposeEvent
  RE_PRESENT: ModalRePresentEvent
}>()

export type ModalDisposeEvent = {
  id: string
}

export type ModalRePresentEvent = {
  id: string
}
