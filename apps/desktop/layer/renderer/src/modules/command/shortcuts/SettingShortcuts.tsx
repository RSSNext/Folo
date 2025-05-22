import { KbdCombined } from "@follow/components/ui/kbd/Kbd.js"
import { cn } from "@follow/utils/utils"
import { useTranslation } from "react-i18next"

import { shortcuts, shortcutsType } from "~/constants/shortcuts"

export const SettingShortcuts = () => {
  const { t } = useTranslation("shortcuts")
  return (
    <div className="mt-4 space-y-6">
      {Object.keys(shortcuts).map((type) => (
        <section key={type}>
          <div className="text-text-secondary mb-2 pl-3 text-sm font-medium capitalize">
            {t(shortcutsType[type])}
          </div>
          <div className="text-text rounded-md border text-[13px]">
            {Object.keys(shortcuts[type]).map((action, index) => (
              <div
                key={`${type}-${action}`}
                className={cn(
                  "flex h-9 items-center justify-between px-3 py-1.5",
                  index % 2 && "bg-fill-quinary",
                )}
              >
                <div>{t(shortcuts[type][action].name)}</div>
                <div>
                  <KbdCombined joint>
                    {`${shortcuts[type][action].key}${shortcuts[type][action].extra ? `, ${shortcuts[type][action].extra}` : ""}`}
                  </KbdCombined>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
