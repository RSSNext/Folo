import { Button } from "@follow/components/ui/button/index.js"
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
import { env } from "@follow/shared/env.desktop"
import { cn } from "@follow/utils/utils"
import dayjs from "dayjs"
import { useTranslation } from "react-i18next"

import { useServerConfigs } from "~/atoms/server-configs"
import { useUserRole, useUserRoleEndDate, useWhoami } from "~/atoms/user"
import { CopyButton } from "~/components/ui/button/CopyButton"
import { subscription } from "~/lib/auth"
import { usePresentUserProfileModal } from "~/modules/profile/hooks"
import { UserAvatar } from "~/modules/user/UserAvatar"
import { useReferralInfo } from "~/queries/referral"

export function SettingReferral() {
  const { t } = useTranslation("settings")
  const serverConfigs = useServerConfigs()
  const requiredInvitationsAmount = serverConfigs?.REFERRAL_REQUIRED_INVITATIONS || 3
  const { data: referralInfo } = useReferralInfo()
  const validInvitationsAmount =
    referralInfo?.invitations.filter((invitation) => !!invitation.user?.enabled).length || 0
  const user = useWhoami()
  const role = useUserRole()
  const roleEndDate = useUserRoleEndDate()
  const daysLeft = roleEndDate
    ? Math.ceil((roleEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null
  const referralLink = `${env.VITE_WEB_URL}/register?referral=${user?.handle || user?.id}`
  const presentUserProfile = usePresentUserProfileModal("drawer")
  return (
    <section className="mt-4">
      <Button
        onClick={() => {
          subscription.upgrade({
            plan: "folo pro preview",
          })
        }}
      >
        hi
      </Button>
      <div className="mb-4 space-y-2 text-sm">
        <p>
          {t("referral.description", {
            amount: requiredInvitationsAmount,
            day: referralInfo?.referralCycleDays || 45,
          })}
        </p>
      </div>
      <Divider className="my-6" />
      <p className="my-2 font-semibold">{t("referral.link")}</p>
      <Card className="flex items-center gap-2 px-4 py-2">
        <span>{referralLink}</span>
        <CopyButton variant="outline" value={referralLink} />
      </Card>
      <Divider className="my-6" />
      <Card
        className={cn(
          "p-3",
          role === "user"
            ? "border-blue-100 bg-green-50 dark:border-green-900 dark:bg-green-950"
            : "border-blue-100 bg-blue-50 dark:border-blue-900 dark:bg-blue-950",
        )}
      >
        {role === "user"
          ? t("referral.pro_status.user")
          : role === "preview"
            ? t("referral.pro_status.preview", {
                dateString: dayjs(roleEndDate).format("MMMM D, YYYY"),
                daysLeft,
              })
            : role === "trial"
              ? t("referral.pro_status.trial")
              : ""}
      </Card>
      {role === "preview" ? (
        <div className="mt-4 space-y-2">
          <p>
            {`Referral Progress (${validInvitationsAmount}/${requiredInvitationsAmount} for next extension):`}
          </p>
          <Progress value={(validInvitationsAmount / requiredInvitationsAmount) * 100} />
          <p>
            {`Invite ${requiredInvitationsAmount - validInvitationsAmount} more friends to extend your Pro Preview indefinitely!`}
          </p>
        </div>
      ) : (
        <p>{`Total Activated Referrals: ${validInvitationsAmount}`}</p>
      )}
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
                {row.user?.enabled
                  ? t("referral.invited_friend_status.active")
                  : t("referral.invited_friend_status.signed_up")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  )
}
