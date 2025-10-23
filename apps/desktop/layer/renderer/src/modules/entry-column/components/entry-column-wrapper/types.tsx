export interface EntryColumnWrapperProps extends ComponentType {
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void

  ref?: React.Ref<HTMLDivElement | null>
}
