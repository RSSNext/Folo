import { Header } from "@client/components/layout/header"
import { MemoedDangerousHTMLStyle } from "@follow/components/common/MemoedDangerousHTMLStyle.jsx"
import { PoweredByFooter } from "@follow/components/common/PoweredByFooter.jsx"
import { Outlet } from "react-router"

export const Component = () => {
  return (
    <div className="flex h-full flex-col">
      <MemoedDangerousHTMLStyle>
        {`:root {
          --container-max-width: 1024px;
          }`}
      </MemoedDangerousHTMLStyle>
      <Header />
      <main className="relative mx-auto w-full max-w-[var(--container-max-width)] flex-1">
        <Outlet />
      </main>
      <PoweredByFooter />
    </div>
  )
}
