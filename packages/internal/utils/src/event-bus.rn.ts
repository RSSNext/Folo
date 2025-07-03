import { DeviceEventEmitter } from "react-native"

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CustomEvent {}
export interface EventBusMap extends CustomEvent {}

type AnyObject = Record<string, any>
class EventBusStatic<E extends AnyObject> {
  dispatch<T extends keyof E>(event: T, data: E[T]): void
  dispatch<T extends keyof E>(event: T): void
  dispatch<T extends keyof E>(event: T, data?: E[T]) {
    DeviceEventEmitter.emit(event as string, data)
  }

  subscribe<T extends keyof E>(event: T, callback: (data: E[T]) => void) {
    const subscription = DeviceEventEmitter.addListener(event as string, callback)

    return () => subscription.remove()
  }

  unsubscribe(_event: string, _callback: (data: any) => void) {
    // DeviceEventEmitter doesn't have a direct method to remove a specific listener
    // This is handled by the subscription.remove() returned by subscribe
    // This method is kept for API compatibility
  }
}

export const EventBus = new EventBusStatic<EventBusMap>()
export const createEventBus = <E extends AnyObject>() => new EventBusStatic<E>()
