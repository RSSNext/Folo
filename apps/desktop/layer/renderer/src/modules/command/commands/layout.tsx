import { setTimelineColumnShow } from "~/atoms/sidebar"

import { useRegisterCommandEffect } from "../hooks/use-register-command"
import type { Command } from "../types"
import { COMMAND_ID } from "./id"

export const useRegisterLayoutCommands = () => {
  useRegisterCommandEffect([
    {
      id: COMMAND_ID.layout.toggleTimelineColumn,
      label: "Toggle timeline column",
      run: () => {
        setTimelineColumnShow((show) => !show)
      },
    },
  ])
}

export type ToggleTimelineColumnCommand = Command<{
  id: typeof COMMAND_ID.layout.toggleTimelineColumn
  fn: () => void
}>

export type LayoutCommand = ToggleTimelineColumnCommand
