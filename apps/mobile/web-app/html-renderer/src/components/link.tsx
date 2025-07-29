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

export const MarkdownLink = (props: LinkProps) => {
  // TODO should populate the href with the populatedFullHref

  const populatedFullHref = props.href
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <a
          draggable="false"
          className="text-text font-semibold no-underline"
          href={populatedFullHref}
          title={props.title}
          target="_blank"
          rel="noreferrer"
        >
          {props.children}

          {typeof props.children === "string" && (
            <i className="i-mgc-arrow-right-up-cute-re size-[0.9em] translate-y-[2px] opacity-70" />
          )}
        </a>
      </TooltipTrigger>
      {!!props.href && (
        <TooltipPortal>
          <TooltipContent align="start" className="break-all" side="bottom">
            {populatedFullHref}
          </TooltipContent>
        </TooltipPortal>
      )}
    </Tooltip>
  )
}
