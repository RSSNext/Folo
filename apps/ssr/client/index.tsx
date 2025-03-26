import "@follow/components/tailwind"
import "@follow/components/dayjs"
import "./styles/index.css"

import { ClickToComponent } from "click-to-react-component"
import * as React from "react"
import ReactDOM from "react-dom/client"
import { RouterProvider } from "react-router/dom"

import { initialize } from "./initialize"
import { router } from "./router"

const $container = document.querySelector("#root") as HTMLElement
initialize()

ReactDOM.createRoot($container).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <ClickToComponent editor={import.meta.env.VITE_EDITOR} />
  </React.StrictMode>,
)
