import { MediaContainerWidthContext } from "./MediaContainerWidthContext"

export const MediaContainerWidthProvider = ({
  children,
  width,
}: {
  children: React.ReactNode
  width: number
}) => {
  return <MediaContainerWidthContext value={width}>{children}</MediaContainerWidthContext>
}
