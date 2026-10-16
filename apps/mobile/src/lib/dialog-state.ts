import { atom } from "jotai"

export const dialogCountAtom = atom(0)

/** Native alerts the app keeps open outside the dialog stack, such as the store update prompt */
export const nativeAlertCountAtom = atom(0)
