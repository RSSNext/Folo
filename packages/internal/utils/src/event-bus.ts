// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CustomEvent {}
export interface EventBusMap extends CustomEvent {}

class EventBusEvent extends Event {
  static type = "EventBusEvent"
  constructor(
    public _type: string,
    public data: any,
  ) {
    super(EventBusEvent.type)
  }
}

type IDispatcher<E> = <T extends keyof E>(
  ...args: E[T] extends never ? [event: T] : [event: T, data: E[T]]
) => void
type AnyObject = Record<string, any>
class EventBusStatic<E extends AnyObject> {
  constructor() {
    this.dispatch = this.dispatch.bind(this)
    this.subscribe = this.subscribe.bind(this)
    this.unsubscribe = this.unsubscribe.bind(this)
  }
  dispatch: IDispatcher<E> = <T extends keyof E>(event: T, data?: E[T]) => {
    window.dispatchEvent(new EventBusEvent(event as string, data))
  }

  subscribe<T extends keyof E>(event: T, callback: (data: E[T]) => void) {
    const handler = (e: any) => {
      if (e instanceof EventBusEvent && e._type === event) {
        callback(e.data)
      }
    }
    window.addEventListener(EventBusEvent.type, handler)

    return this.unsubscribe.bind(this, event as string, handler)
  }

  unsubscribe(_event: string, handler: (e: any) => void) {
    window.removeEventListener(EventBusEvent.type, handler)
  }
}

export const EventBus = new EventBusStatic<EventBusMap>()
export const createEventBus = <E extends AnyObject>() => new EventBusStatic<E>()
