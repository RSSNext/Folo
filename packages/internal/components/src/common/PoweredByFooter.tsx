import { cn } from "@follow/utils/utils"

import { Folo } from "../icons/folo"
import { Logo } from "../icons/logo"

export const PoweredByFooter: Component = ({ className }) => (
  <footer className={cn("center mt-12 flex gap-2 pb-5", className)}>
    <span className="text-xs opacity-80">{new Date().getFullYear()}</span>{" "}
    <Logo className="size-5" />{" "}
    <a
      href="https://github.com/RSSNext"
      className="font-default text-accent cursor-pointer font-bold no-underline"
      target="_blank"
      rel="noreferrer"
    >
      <Folo className="size-8" />
    </a>
  </footer>
)
