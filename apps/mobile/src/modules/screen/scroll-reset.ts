type ScrollResetSignalState = {
  resetSignal?: number
  appliedResetSignal?: number
}

export const shouldApplyScrollResetSignal = ({
  resetSignal,
  appliedResetSignal,
}: ScrollResetSignalState) => resetSignal !== undefined && resetSignal !== appliedResetSignal

export const shouldSuspendMarkReadForScrollReset = shouldApplyScrollResetSignal
