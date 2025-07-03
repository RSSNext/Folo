import { Card } from "@follow/components/ui/card/index.js"
import { Divider } from "@follow/components/ui/divider/Divider.js"
import { Progress } from "@follow/components/ui/progress/index.js"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@follow/components/ui/table/index.jsx"
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@follow/components/ui/tooltip/index.js"
import { UserRole, UserRoleName } from "@follow/constants"
import { env } from "@follow/shared/env.desktop"
import { useUserRole, useWhoami } from "@follow/store/user/hooks"
import dayjs from "dayjs"
import { Trans, useTranslation } from "react-i18next"

import { useServerConfigs } from "~/atoms/server-configs"
import { CopyButton } from "~/components/ui/button/CopyButton"
import { usePresentUserProfileModal } from "~/modules/profile/hooks"
import { UserAvatar } from "~/modules/user/UserAvatar"
import { useReferralInfo } from "~/queries/referral"

export function SettingReferral() {
  const { t } = useTranslation("settings")
  const serverConfigs = useServerConfigs()
  const requiredInvitationsAmount = serverConfigs?.REFERRAL_REQUIRED_INVITATIONS || 3
  const ruleLink = serverConfigs?.REFERRAL_RULE_LINK
  const { data: referralInfo } = useReferralInfo()
  const validInvitationsAmount = referralInfo?.invitations.filter((i) => i.usedAt).length || 0
  const user = useWhoami()
  const role = useUserRole()
  const referralLink = `${env.VITE_WEB_URL}/register?referral=${user?.handle || user?.id}`
  const presentUserProfile = usePresentUserProfileModal("drawer")
  return (
    <section className="mt-4">
      <div className="mb-4 space-y-2 text-sm">
        <p>
          <Trans
            ns="settings"
            i18nKey="referral.description"
            values={{
              day: referralInfo?.referralCycleDays || 45,
            }}
            components={{
              Link: <a href={ruleLink} className="text-accent" target="_blank" />,
            }}
          />
        </p>
      </div>
      <Divider className="my-6" />
      <p className="my-2 font-semibold">{t("referral.link")}</p>
      <Card className="flex items-center gap-2 px-3 py-1.5">
        <span>{referralLink}</span>
        <CopyButton variant="outline" value={referralLink} />
      </Card>
      {role !== UserRole.PrePro && (
        <div className="mt-4 space-y-2">
          <p className="font-semibold">
            Referral Progress for the Free {UserRoleName[UserRole.PrePro]}:
          </p>
          <div className="flex items-center gap-4">
            <Progress value={(validInvitationsAmount / requiredInvitationsAmount) * 100} />
            <span className="shrink-0">
              {validInvitationsAmount} / {requiredInvitationsAmount}
            </span>
          </div>
        </div>
      )}
      {!!referralInfo?.invitations.length && (
        <>
          <Divider className="my-6" />
          <p className="font-semibold">Your Invited Friends</p>
          <Table className="mt-4">
            <TableHeader>
              <TableRow className="[&_*]:!font-semibold">
                <TableHead size="sm">Friend (Email/ID)</TableHead>
                <TableHead size="sm">Joined On</TableHead>
                <TableHead size="sm">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="border-t-[12px] border-transparent [&_td]:!px-3">
              {referralInfo?.invitations?.map((row) => (
                <TableRow key={row.code} className="h-8">
                  <TableCell size="sm">
                    <Tooltip>
                      <TooltipTrigger>
                        <button
                          type="button"
                          className="cursor-pointer"
                          onClick={() => {
                            presentUserProfile(row.user?.id)
                          }}
                        >
                          <UserAvatar
                            userId={row.user?.id}
                            className="h-auto p-0"
                            avatarClassName="size-5"
                            hideName
                          />
                        </button>
                      </TooltipTrigger>
                      {row.user?.name && (
                        <TooltipPortal>
                          <TooltipContent>{row.user?.name}</TooltipContent>
                        </TooltipPortal>
                      )}
                    </Tooltip>
                  </TableCell>
                  <TableCell size="sm">{dayjs(row.createdAt).format("MMMM D, YYYY")}</TableCell>
                  <TableCell size="sm">
                    {row.usedAt ? (
                      t("referral.invited_friend_status.valid")
                    ) : (
                      <Tooltip>
                        <TooltipTrigger>
                          {t("referral.invited_friend_status.pending")}
                        </TooltipTrigger>
                        <TooltipPortal>
                          <TooltipContent>Active status are refreshed daily</TooltipContent>
                        </TooltipPortal>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </section>
  )
}
