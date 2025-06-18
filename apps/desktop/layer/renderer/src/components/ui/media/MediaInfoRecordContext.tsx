import { createContext } from "react"

import type { MediaInfoRecord } from "./MediaInfoRecord"

export const MediaInfoRecordContext = createContext<MediaInfoRecord>({})
