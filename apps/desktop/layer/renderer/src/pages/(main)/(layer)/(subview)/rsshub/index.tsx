import { Logo } from "@follow/components/icons/logo.jsx"
import { Button } from "@follow/components/ui/button/index.js"
import type { RSSHubModel } from "@follow/models"
import { whoami } from "@follow/store/user/getters"
import { cn, formatNumber } from "@follow/utils/utils"
import { memo, useCallback, useEffect } from "react"
import { useTranslation } from "react-i18next"

import RSSHubIconUrl from "~/assets/rsshub-icon.png?url"
import { ErrorTooltip } from "~/components/common/ErrorTooltip"
import { HeaderActionButton, HeaderActionGroup } from "~/components/ui/button/HeaderActionButton"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { useAuthQuery } from "~/hooks/common"
import { useSetSubViewRightView, useSubViewTitle } from "~/modules/app-layout/subview/hooks"
import { useTOTPModalWrapper } from "~/modules/profile/hooks"
import { AddModalContent } from "~/modules/rsshub/add-modal-content"
import { ConfirmDeleteModalContent } from "~/modules/rsshub/delete-modal-content"
import { SetModalContent } from "~/modules/rsshub/set-modal-content"
import { UserAvatar } from "~/modules/user/UserAvatar"
import { Queries } from "~/queries"
import { useSetRSSHubMutation } from "~/queries/rsshub"

const RSSHubIcon = new URL(RSSHubIconUrl, import.meta.url).href

export function Component() {
  const { t } = useTranslation("settings")
  const { present } = useModalStack()

  useSubViewTitle("words.rsshub")
  const setRightView = useSetSubViewRightView()
  const handleAddInstance = useCallback(() => {
    present({
      title: t("rsshub.add_new_instance"),
      content: ({ dismiss }) => <AddModalContent dismiss={dismiss} />,
    })
  }, [present, t])
  useEffect(() => {
    setRightView(
      <HeaderActionGroup>
        <HeaderActionButton variant="accent" icon="i-mingcute-add-line" onClick={handleAddInstance}>
          {t("rsshub.add_new_instance")}
        </HeaderActionButton>
      </HeaderActionGroup>,
    )
    return () => {
      setRightView(null)
    }
  }, [setRightView, handleAddInstance, t])
  const list = useAuthQuery(Queries.rsshub.list())

  return (
    <div className="flex size-full flex-col px-6 py-8">
      {/* Simple Header */}
      <div className="mx-auto mb-8 max-w-6xl text-center">
        <div className="mb-4 flex justify-center">
          <img src={RSSHubIcon} className="size-16" alt="RSSHub" />
        </div>
        <h1 className="text-text mb-4 text-3xl font-bold">{t("words.rsshub", { ns: "common" })}</h1>
        <p className="text-text-secondary mx-auto max-w-2xl text-sm leading-relaxed">
          {t("rsshub.description")}
        </p>
      </div>

      <div className="mx-auto w-full max-w-6xl">
        {/* Add Instance Section */}
        <div className="mb-8 flex justify-center">
          <Button onClick={handleAddInstance}>
            <i className="i-mgc-add-cute-re mr-2 size-4" />
            <span>{t("rsshub.add_new_instance")}</span>
          </Button>
        </div>

        {/* Instances Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-text text-xl font-semibold">{t("rsshub.public_instances")}</h2>
          </div>
          <List data={list?.data} />
        </div>
      </div>
    </div>
  )
}

type InstanceItem = RSSHubModel | { id: string; isOfficial: true }

const InstanceCard = memo(({ item }: { item: InstanceItem }) => {
  const { t } = useTranslation("settings")
  const me = whoami()
  const status = useAuthQuery(Queries.rsshub.status())
  const setRSSHubMutation = useSetRSSHubMutation()
  const presetTOTPModal = useTOTPModalWrapper(setRSSHubMutation.mutateAsync)
  const { present } = useModalStack()

  const isOfficial = "isOfficial" in item && item.isOfficial
  const instance = isOfficial ? ({} as Partial<RSSHubModel>) : (item as RSSHubModel)

  const isInUse = isOfficial
    ? !status?.data?.usage?.rsshubId
    : status?.data?.usage?.rsshubId === instance.id
  const isOwner = !isOfficial && instance.ownerUserId === me?.id
  const hasError = !isOfficial && !!instance.errorMessage

  const headerIcon = isOfficial ? (
    <Logo className="size-8" />
  ) : (
    <UserAvatar
      userId={instance.ownerUserId}
      className="h-auto justify-start p-0"
      avatarClassName="size-8"
    />
  )

  const title = isOfficial ? "Folo Official" : ""
  const price = isOfficial ? 0 : instance.price
  const description = isOfficial ? "Folo Built-in RSSHub" : instance.description

  const usersStat = isOfficial ? "*" : instance.userCount || 0
  const limitStat = isOfficial
    ? t("rsshub.table.unlimited")
    : instance.userLimit == null
      ? t("rsshub.table.unlimited")
      : instance.userLimit > 1
        ? instance.userLimit
        : t("rsshub.table.private")

  const tags = (
    <>
      {isOfficial && (
        <span className="bg-accent/10 text-accent rounded px-1.5 py-0.5 text-xs">
          {t("rsshub.table.official")}
        </span>
      )}
      {isInUse && (
        <span className="bg-green/10 text-green rounded px-1.5 py-0.5 text-xs">
          {t("rsshub.table.inuse")}
        </span>
      )}
      {isOwner && (
        <span className="bg-purple/10 text-purple rounded px-1.5 py-0.5 text-xs">
          {t("rsshub.table.yours")}
        </span>
      )}
      {hasError && <span className="bg-red/10 text-red rounded px-1.5 py-0.5 text-xs">Error</span>}
    </>
  )

  const containerClassName = cn(
    "border-fill-secondary relative rounded-lg border p-4",
    isOfficial ? "bg-fill-vibrant-quaternary" : "bg-fill-vibrant-quinary",
    isInUse && "ring-accent/20 ring-2",
    hasError && "border-red/30 bg-red/5",
  )

  const instanceUserCountExceptOwner = isOfficial
    ? 0
    : instance.userCount
      ? instance.userCount - (instance.ownerUserId === me?.id ? 1 : 0)
      : 0

  return (
    <div className={containerClassName}>
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          {headerIcon}
          <div>
            <h3 className="text-text text-sm font-semibold">{title}</h3>
            <div className="flex items-center gap-1">{tags}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-sm font-medium">
            {formatNumber(price ?? 0)} <i className="i-mgc-power text-accent size-3" />
          </div>
        </div>
      </div>

      <p className="text-text-secondary mb-3 line-clamp-1 text-xs">{description}</p>

      <div className="flex items-center justify-between text-xs">
        <div className="flex gap-4">
          <div>
            <span className="text-text-secondary">Users:</span>{" "}
            <span className="text-text">{String(usersStat)}</span>
          </div>
          <div>
            <span className="text-text-secondary">Limit:</span>{" "}
            <span className="text-text">{String(limitStat)}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-1">
          {!isOfficial && isOwner && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  present({
                    title: t("rsshub.table.edit"),
                    content: ({ dismiss }) => (
                      <AddModalContent dismiss={dismiss} instance={instance as RSSHubModel} />
                    ),
                  })
                }
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!!instanceUserCountExceptOwner}
                onClick={() =>
                  present({
                    title: t("rsshub.table.delete.label"),
                    content: ({ dismiss }) => (
                      <ConfirmDeleteModalContent dismiss={dismiss} id={instance.id!} />
                    ),
                  })
                }
              >
                Del
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center">
          {isOfficial ? (
            <div>
              {isInUse ? (
                <Button disabled size="sm">
                  {t("rsshub.table.inuse")}
                </Button>
              ) : (
                <Button size="sm" onClick={() => presetTOTPModal({ id: null })}>
                  {t("rsshub.table.use")}
                </Button>
              )}
            </div>
          ) : (
            <SelectInstanceButton instance={instance as RSSHubModel} />
          )}
        </div>
      </div>
    </div>
  )
})

function List({ data }: { data?: RSSHubModel[] }) {
  const status = useAuthQuery(Queries.rsshub.status())

  const sortedData: InstanceItem[] = [
    // Official instance first
    {
      id: "official",
      isOfficial: true,
    },
    // Then user instances
    ...(data?.sort((a, b) => {
      // in use first
      if (status?.data?.usage?.rsshubId === a.id) {
        return -1
      }
      if (status?.data?.usage?.rsshubId === b.id) {
        return 1
      }

      if (a.errorMessage && !b.errorMessage) {
        return 1
      }
      if (!a.errorMessage && b.errorMessage) {
        return -1
      }

      const loadA = Math.min((a.userCount ?? 0) / (a.userLimit ?? Infinity), 1)
      const loadB = Math.min((b.userCount ?? 0) / (b.userLimit ?? Infinity), 1)

      // full load last
      if (loadA === 1 && loadB === 1) {
        return a.price - b.price
      }
      if (loadA === 1) {
        return 1
      }
      if (loadB === 1) {
        return -1
      }

      return a.price - b.price || loadA - loadB
    }) || []),
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
      {sortedData.map((item) => (
        <InstanceCard key={item.id} item={item} />
      ))}
    </div>
  )
}

function SelectInstanceButton({ instance }: { instance: RSSHubModel }) {
  const { t } = useTranslation("settings")
  const { present } = useModalStack()
  const status = useAuthQuery(Queries.rsshub.status())

  const isNotAvailable = !!instance.errorMessage
  const limitReached =
    instance.userCount && instance.userLimit ? instance.userCount >= instance.userLimit : false

  return (
    <ErrorTooltip errorAt={instance.errorAt} errorMessage={instance.errorMessage} showWhenError>
      <Button
        buttonClassName="shrink-0"
        disabled={isNotAvailable || limitReached}
        variant={status?.data?.usage?.rsshubId === instance.id ? "outline" : "primary"}
        onClick={() => {
          present({
            title: t("rsshub.useModal.title"),
            content: ({ dismiss }) => <SetModalContent dismiss={dismiss} instance={instance} />,
          })
        }}
      >
        {t(
          status?.data?.usage?.rsshubId === instance.id
            ? "rsshub.table.inuse"
            : isNotAvailable
              ? "rsshub.table.unavailable"
              : limitReached
                ? "rsshub.table.limit_reached"
                : "rsshub.table.use",
        )}
      </Button>
    </ErrorTooltip>
  )
}
