import { PoweredByFooter } from "@client/components/common/PoweredByFooter"
import { Header } from "@client/components/layout/header"
import { MemoedDangerousHTMLStyle } from "@follow/components/common/MemoedDangerousHTMLStyle.jsx"
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
      <main className="bg-background center relative mx-auto mb-12 mt-[calc(100px+3rem)] flex w-full max-w-[var(--container-max-width)] flex-1 flex-col p-4 lg:p-0">
        <Outlet />
      </main>
      <PoweredByFooter />
    </div>
  )
}
