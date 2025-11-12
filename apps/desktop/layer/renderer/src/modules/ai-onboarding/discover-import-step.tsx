import { Button } from "@follow/components/ui/button/index.js"
import { useSetAtom } from "jotai"

import { useI18n } from "~/hooks/common"

import { DiscoverImport } from "../discover/DiscoverImport"
import { stepAtom } from "./store"

export function DiscoverImportStep() {
  const t = useI18n()
  const setStep = useSetAtom(stepAtom)
  return (
    <div>
      <DiscoverImport />

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button variant="ghost" onClick={() => setStep("intro")}>
          {t.app("new_user_guide.actions.back")}
        </Button>

        <Button onClick={() => setStep("manual-import-pre-finish")}>
          {t.app("new_user_guide.actions.finish")}
        </Button>
      </div>
    </div>
  )
}
