export const tooltipStyle = {
  content: [
    "relative z-[101] bg-white px-2 py-1 text-text dark:bg-neutral-950",
    "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
    "rounded-lg text-sm",
    "max-w-[75ch] select-text",
    "drop-shadow data-[side=top]:shadow-tooltip-bottom data-[side=bottom]:shadow-tooltip-top",
    tw`dark:drop-shadow-[0_0_1px_theme(colors.white/0.5)]`,
  ],
}
