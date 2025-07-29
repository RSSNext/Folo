import { appIsReady } from "~/atoms/app"

const afterReadyCallbackQueue = [] as Array<() => void>

export const waitAppReady = (callback: () => void, delay = 0) => {
  if (appIsReady()) {
    delay ? callback() : setTimeout(callback, delay)
  } else {
    afterReadyCallbackQueue.push(callback)
  }
}

export const applyAfterReadyCallbacks = () => {
  afterReadyCallbackQueue.forEach((callback) => callback())
  afterReadyCallbackQueue.length = 0
}
