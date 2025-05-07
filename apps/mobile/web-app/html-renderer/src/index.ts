import "@follow/components/assets/colors-media.css"
import "@follow/components/assets/tailwind.css"
import "./index.css"

import { createElement } from "react"
import { createRoot } from "react-dom/client"

import { App } from "./App"
import { isInRn } from "./utils"

const root = document.querySelector("#root")
if (root) {
  createRoot(root).render(createElement(App))
}

// Set web app background if in browser
if (!isInRn) {
  const handler = (e: MediaQueryListEvent) => {
    // Set background color
    const isDark = e.matches
    document.body.style.backgroundColor = isDark ? "#000" : "#fff"
  }

  // Observe media query
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
  mediaQuery.addEventListener("change", handler)
  handler({
    matches: mediaQuery.matches,
  } as MediaQueryListEvent)
}
