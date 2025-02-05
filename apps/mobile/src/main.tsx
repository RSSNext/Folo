import "@expo/metro-runtime"

import { registerRootComponent } from "expo"
import { Image } from "expo-image"
import { App } from "expo-router/build/qualified-entry"
import { cssInterop } from "nativewind"
import { RootSiblingParent } from "react-native-root-siblings"

// import { renderRootComponent } from "expo"
import { initializeApp } from "./initialize"

cssInterop(Image, { className: "style" })

initializeApp().then(() => {
  // This file should only import and register the root. No components or exports
  // should be added here.
  // renderRootComponent(App)
})

const MApp = () => {
  return (
    <RootSiblingParent>
      <App />
    </RootSiblingParent>
  )
}

registerRootComponent(MApp)
