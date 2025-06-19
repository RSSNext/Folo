import type { MediaInfoRecord } from "./MediaInfoRecord"
import { MediaInfoRecordContext } from "./MediaInfoRecordContext"

const noop = {} as const
export const MediaInfoRecordProvider = ({
  children,
  mediaInfo,
}: {
  children: React.ReactNode
  mediaInfo?: Nullable<MediaInfoRecord>
}) => {
  return <MediaInfoRecordContext value={mediaInfo || noop}>{children}</MediaInfoRecordContext>
}
