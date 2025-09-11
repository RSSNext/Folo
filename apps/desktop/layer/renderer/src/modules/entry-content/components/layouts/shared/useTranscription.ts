import { useEntry } from "@follow/store/entry/hooks"
import { useQuery } from "@tanstack/react-query"

import { followClient } from "~/lib/api-client"

export const useTranscription = (entryId: string) => {
  const entry = useEntry(entryId, (state) => {
    return {
      audioUrl: state.attachments?.find((att) => att.mime_type?.startsWith("audio/"))?.url,
      subtitleUrl: state.attachments?.find((att) => att.mime_type === "text/srt")?.url,
    }
  })

  return useQuery({
    queryKey: ["transcription", entryId],
    queryFn: async () => {
      if (entry?.subtitleUrl) {
        return (await fetch(entry.subtitleUrl)).text()
      }

      if (entry?.audioUrl) {
        const res = await followClient.api.entries.transcription({ url: entry.audioUrl })
        return res.data?.srt || ""
      }
      return ""
    },
  })
}
