import { Card, CardContent } from "@follow/components/ui/card/index.jsx"
import { ResponsiveSelect } from "@follow/components/ui/select/responsive.js"
import { CategoryMap, RSSHubCategories } from "@follow/constants"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { setUISetting, useUISettingKey } from "~/atoms/settings/ui"

const LanguageOptions = [
  {
    label: "words.all",
    value: "all",
  },
  {
    label: "words.english",
    value: "eng",
  },
  {
    label: "words.chinese",
    value: "cmn",
  },
]

type Language = "all" | "eng" | "cmn"

export function Recommendations() {
  const { t } = useTranslation()
  const { t: tCommon } = useTranslation("common")

  const lang = useUISettingKey("discoverLanguage")

  const handleLangChange = (value: string) => {
    setUISetting("discoverLanguage", value as Language)
  }

  return (
    <div className="mx-auto mt-4 w-full max-w-[800px] space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-center gap-2 text-center text-xl font-bold">
          <i className="i-mgc-grid-2-cute-re text-xl" />
          <span>{t("words.categories")}</span>
        </div>
        <div className="center flex justify-center">
          <div className="flex items-center gap-2">
            <span className="text-text shrink-0 text-sm font-medium">{t("words.language")}</span>
            <ResponsiveSelect
              value={lang}
              onValueChange={handleLangChange}
              triggerClassName="h-8 rounded border-0"
              size="sm"
              items={LanguageOptions}
              renderItem={(item) => tCommon(item.label as any)}
              renderValue={(item) => tCommon(item.label as any)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {RSSHubCategories.map((cat) => (
          <Link to={`/discover/category/${cat}`} key={cat}>
            <Card
              className="cursor-pointer transition-all duration-200 hover:scale-[102%] hover:shadow-lg"
              style={{
                backgroundImage: `linear-gradient(-135deg, ${CategoryMap[cat]?.color}80, ${CategoryMap[cat]?.color})`,
              }}
            >
              <CardContent className="group relative flex aspect-square flex-col overflow-hidden p-0">
                <div className="absolute right-2 top-2 size-12 rotate-12 opacity-20">
                  <div className="text-5xl">{CategoryMap[cat]?.emoji}</div>
                </div>
                <div className="flex size-full flex-col items-start justify-end p-6 text-left">
                  <div className="mb-3 text-4xl transition-transform duration-300 group-hover:scale-[1.2]">
                    {CategoryMap[cat]?.emoji}
                  </div>
                  <div className="text-lg font-bold text-white drop-shadow-sm">
                    {t(`discover.category.${cat}`, { ns: "common" })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
