import { Button } from "@follow/components/ui/button/index.js"
import { Divider } from "@follow/components/ui/divider/Divider.js"
import { Label } from "@follow/components/ui/label/index.js"

import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { AccountManagement } from "~/modules/profile/account-management"
import { EmailManagement } from "~/modules/profile/email-management"
import { useTOTPModalWrapper } from "~/modules/profile/hooks"
import { ProfileSettingForm } from "~/modules/profile/profile-setting-form"
import { TwoFactor } from "~/modules/profile/two-factor"
import { UpdatePasswordForm } from "~/modules/profile/update-password-form"
import { SettingsTitle } from "~/modules/settings/title"
import { defineSettingPageData } from "~/modules/settings/utils"
import { deleteUser } from "~/queries/auth"

const iconName = "i-mgc-user-setting-cute-re"
const priority = (1000 << 3) + 10
export const loader = defineSettingPageData({
  icon: iconName,
  name: "titles.account",
  priority,
})

export function Component() {
  const { present } = useModalStack()
  const preset = useTOTPModalWrapper(deleteUser, { force: true })
  return (
    <>
      <SettingsTitle />
      <section className="mt-4">
        <EmailManagement />
        <ProfileSettingForm />

        <Divider className="mb-6 mt-8" />

        <div className="space-y-4">
          <AccountManagement />
          <UpdatePasswordForm />
          <TwoFactor />
          <div className="flex items-center justify-between">
            <Label>Delete Account</Label>
            <Button
              variant="outline"
              onClick={() => {
                present({
                  title: "Delete Account",
                  content: () => (
                    <div className="max-w-96">
                      <p className="mb-4 text-sm text-zinc-500">
                        Are you sure you want to delete your account? This action is irreversible
                        and may take up to two days to take effect.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          preset({})
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  ),
                })
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
