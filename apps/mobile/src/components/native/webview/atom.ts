import { atom } from "jotai"
import { Dimensions } from "react-native"

export const sharedWebViewHeightAtom = atom<number>(Dimensions.get("window").height)
