import { t } from "./_instance"

export const debugRoute = {
  inspectElement: t.procedure
    .input<{ x: number; y: number }>()
    .action(async ({ input, context }) => {
      context.sender.inspectElement(input.x, input.y)
    }),
}
