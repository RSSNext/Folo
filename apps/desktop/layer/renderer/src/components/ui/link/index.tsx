import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@follow/components/ui/tooltip/index.jsx"

export interface LinkProps {
  href: string
  title: string
  children: React.ReactNode
  target: string
}

export const LinkWithTooltip = (props: LinkProps) => (
  <Tooltip delayDuration={0}>
    <TooltipTrigger asChild>
      <a href={props.href} title={props.title} target={props.target}>
        {props.children}
      </a>
    </TooltipTrigger>
    <TooltipPortal>
      <TooltipContent align="start" className="break-all" side="bottom">
        {props.href}
      </TooltipContent>
    </TooltipPortal>
  </Tooltip>
)
