/**
 * Check if drag event contains files
 */
export function dragEventHasFiles(event: DragEvent): boolean {
  return event.dataTransfer?.types.includes("Files") ?? false
}

/**
 * Check if clipboard event contains files
 */
export function clipboardEventHasFiles(event: ClipboardEvent): boolean {
  return !!(event.clipboardData?.files && event.clipboardData.files.length > 0)
}

/**
 * Prevent default drag behaviors
 */
export function preventDefaultDrag(event: DragEvent): void {
  event.preventDefault()
  event.stopPropagation()
}

/**
 * Get files from drop event
 */
export function getFilesFromDrop(event: DragEvent): FileList | null {
  return event.dataTransfer?.files ?? null
}

/**
 * Get files from paste event
 */
export function getFilesFromPaste(event: ClipboardEvent): FileList | null {
  return event.clipboardData?.files ?? null
}

/**
 * Debounce drag counter for proper drag leave handling
 */
export function createDragCounter() {
  let counter = 0

  return {
    increment: () => ++counter,
    decrement: () => --counter,
    get: () => counter,
    reset: () => {
      counter = 0
      return counter
    },
  }
}
