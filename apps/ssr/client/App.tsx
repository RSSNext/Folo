import { Outlet } from "react-router"

import { RootProviders } from "./providers/root-providers"

function App() {
  return (
    <RootProviders>
      <Outlet />
    </RootProviders>
  )
}

export { App as Component }
