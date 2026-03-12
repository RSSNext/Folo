import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip'

import { ENTRY_DETAIL } from '../mocks'

export const SimulatorReaders = () => {
  return (
    <div className="items-center relative flex mt-4 -space-x-2">
      {ENTRY_DETAIL.readers.map((reader) => {
        return (
          <Tooltip delayDuration={0} key={reader.id}>
            <TooltipTrigger className="relative flex shrink-0 overflow-hidden rounded-full border-border ring-background aspect-square size-6 border ring-1">
              <img
                className="aspect-square size-full bg-material-ultra-thick"
                src={reader.avatar}
              />
            </TooltipTrigger>
            <TooltipContent>Recent reader: {reader.name}</TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
