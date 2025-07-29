import type { FetchTemplate } from "@follow/shared/settings/interface"
import { cn } from "@follow/utils"
import { useTranslation } from "react-i18next"

import { CustomIntegrationManager } from "./custom-integration-manager"

interface CustomIntegrationValidatorProps {
  fetchTemplate: FetchTemplate
  className?: string
}

export const CustomIntegrationValidator = ({
  fetchTemplate,
  className,
}: CustomIntegrationValidatorProps) => {
  const { t } = useTranslation("settings")

  const validation = CustomIntegrationManager.validateFetchTemplate(fetchTemplate)

  if (validation.valid) {
    return (
      <div className={cn("flex items-center gap-2 text-sm", className)}>
        <i className="i-mgc-check-circle-cute-re text-green" />
        <span className="text-green">
          {t("integration.custom_integrations.validation.valid", "Template is valid")}
        </span>
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 text-sm">
        <i className="i-mgc-close-circle-cute-re text-red" />
        <span className="text-red">
          {t("integration.custom_integrations.validation.invalid", "Template has errors")}
        </span>
      </div>
      <ul className="text-red ml-6 space-y-1 text-sm">
        {validation.errors.map((error, index) => (
          <li key={index} className="list-disc">
            {error}
          </li>
        ))}
      </ul>
    </div>
  )
}
