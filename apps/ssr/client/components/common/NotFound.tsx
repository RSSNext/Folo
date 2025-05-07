import { PoweredByFooter } from "@follow/components/common/PoweredByFooter.jsx"
import { Logo } from "@follow/components/icons/logo.jsx"
import { Button } from "@follow/components/ui/button/index.js"
import { useLocation } from "react-router"

export const NotFound = () => {
  const location = useLocation()

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
          <Button onClick={() => (window.location.href = "/")}>Back to Home</Button>
        </p>
      </main>

      <PoweredByFooter />
    </div>
  )
}
