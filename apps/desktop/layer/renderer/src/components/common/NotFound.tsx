import { Logo } from "@follow/components/icons/logo.jsx"
import { Button } from "@follow/components/ui/button/index.js"
import { ELECTRON_BUILD } from "@follow/shared/constants"
import { captureException } from "@sentry/react"
import { useEffect } from "react"
import type { Location } from "react-router"
import { Navigate, useLocation, useNavigate } from "react-router"

import { useSyncTheme } from "~/hooks/common"
import { removeAppSkeleton } from "~/lib/app"

import { PoweredByFooter } from "./PoweredByFooter"

class AccessNotFoundError extends Error {
  constructor(
    message: string,
    public path: string,
    public location: Location<any>,
  ) {
    super(message)
    this.name = "AccessNotFoundError"
  }

  override toString() {
    return `${this.name}: ${this.message} at ${this.path}`
  }
}
export const NotFound = () => {
  const location = useLocation()
  useSyncTheme()

  useEffect(() => {
    if (!ELECTRON_BUILD) {
      return
    }
    captureException(
      new AccessNotFoundError(
        "Electron app got to a 404 page, this should not happen",
        location.pathname,
        location,
      ),
    )
  }, [location])

  useEffect(() => {
    removeAppSkeleton()
  }, [])
  const navigate = useNavigate()

  if (location.pathname.endsWith("/index.html")) {
    return <Navigate to="/" />
  }

  return (
    <div className="prose center dark:prose-invert m-auto size-full flex-col">
      <main className="flex grow flex-col items-center justify-center">
        <div className="center mb-8 flex">
          <Logo className="size-20" />
        </div>
        <p className="font-semibold">
          You have come to a desert of knowledge where there is nothing.
        </p>
        <p>
          Current path: <code>{location.pathname}</code>
        </p>

        <p>
          <Button onClick={() => navigate("/")}>Back to Home</Button>
        </p>
      </main>

      <PoweredByFooter className="center -mt-12 flex gap-2 py-8" />
    </div>
  )
}
