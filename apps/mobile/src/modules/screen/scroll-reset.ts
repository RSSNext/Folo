type ScrollResetSignalState = {
  resetSignal?: number
  appliedResetSignal?: number
}

export const shouldApplyScrollResetSignal = ({
  resetSignal,
  appliedResetSignal,
}: ScrollResetSignalState) => resetSignal !== undefined && resetSignal !== appliedResetSignal

export const shouldSuspendMarkReadForScrollReset = shouldApplyScrollResetSignal

export const getResetScrollSignalForContent = ({
  entryCount,
  hasScrollableSkeleton,
  isReady,
  resetScrollSignal,
}: {
  entryCount: number
  hasScrollableSkeleton: boolean
  isReady: boolean
  resetScrollSignal?: number
}) => (!isReady && entryCount === 0 && hasScrollableSkeleton ? undefined : resetScrollSignal)
