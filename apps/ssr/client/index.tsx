import "@follow/components/dayjs"
// Imported apart from index.css: the production Tailwind pass rewrites the whole sheet
// and loses the font files' relative url()s, so the fonts were never bundled
import "@follow/components/assets/font.css"
import "./styles/index.css"

import * as React from "react"
import ReactDOM from "react-dom/client"
import { RouterProvider } from "react-router/dom"

import { initialize } from "./initialize"
import { router } from "./router"

const $container = document.querySelector("#root") as HTMLElement
initialize().finally(() => {
  ReactDOM.createRoot($container).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  )
})
