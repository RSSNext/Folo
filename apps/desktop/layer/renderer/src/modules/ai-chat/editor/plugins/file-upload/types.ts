export interface FileUploadPluginConfig {
  /**
   * Enable drag and drop file upload
   */
  enableDragDrop?: boolean
  /**
   * Enable paste file upload
   */
  enablePaste?: boolean
}

export interface FileDropZoneState {
  isDragOver: boolean
  dragCounter: number
}
