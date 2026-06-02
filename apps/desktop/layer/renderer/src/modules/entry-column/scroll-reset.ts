type ScrollResetSignalState = {
  resetSignal?: number
  appliedResetSignal?: number
}

export const shouldApplyScrollResetSignal = ({
  resetSignal,
  appliedResetSignal,
}: ScrollResetSignalState) => resetSignal !== undefined && resetSignal !== appliedResetSignal

export const shouldSuspendMarkReadForScrollReset = shouldApplyScrollResetSignal

export const getInitialScrollOffset = ({
  cachedOffset,
  resetSignal,
  appliedResetSignal,
}: ScrollResetSignalState & {
  cachedOffset: number | undefined
}) =>
  shouldApplyScrollResetSignal({
    resetSignal,
    appliedResetSignal,
  })
    ? 0
    : (cachedOffset ?? 0)
