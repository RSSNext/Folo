export interface EntryColumnWrapperProps extends ComponentType {
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void
  onPullToRefresh?: () => Promise<any>
  ref?: React.Ref<HTMLDivElement | null>
}
