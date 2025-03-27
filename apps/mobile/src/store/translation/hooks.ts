import { useQuery } from "@tanstack/react-query"

import { useGeneralSettingKey } from "@/src/atoms/settings/general"
import type { SupportedLanguages } from "@/src/lib/language"

import { translationSyncService } from "./store"

export const usePrefetchEntryTranslation = ({
  entryId,
  language,
}: {
  entryId: string
  language: SupportedLanguages
}) => {
  const translation = useGeneralSettingKey("translation")
  return useQuery({
    queryKey: ["entry-translation", entryId, language],
    queryFn: () => translationSyncService.generateTranslation(entryId, language),
    enabled: translation,
  })
}
