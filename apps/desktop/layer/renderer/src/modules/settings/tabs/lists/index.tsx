import { Avatar, AvatarImage } from "@follow/components/ui/avatar/index.jsx"
import { ActionButton, Button } from "@follow/components/ui/button/index.js"
import { Divider } from "@follow/components/ui/divider/index.js"
import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
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
} from "@follow/components/ui/tooltip/index.jsx"
import { getView } from "@follow/constants"
import { useOwnedLists, usePrefetchLists } from "@follow/store/list/hooks"
import { listSyncServices } from "@follow/store/list/store"
import { cn, formatNumber } from "@follow/utils/utils"
import { useMutation } from "@tanstack/react-query"
import { useMemo } from "react"
import { toast } from "sonner"

import { useCurrentModal, useModalStack } from "~/components/ui/modal/stacked/hooks"
import { useI18n } from "~/hooks/common"
import { UrlBuilder } from "~/lib/url-builder"

import { ListCreationModalContent, ListFeedsModalContent } from "./modals"

const ConfirmDestroyModalContent = ({ listId }: { listId: string }) => {
  const t = useI18n()
  const currentModal = useCurrentModal()

  const deleteFeedList = useMutation({
    mutationFn: (payload: { listId: string }) => listSyncServices.deleteList(payload.listId),
    onSuccess: () => {
      toast.success(t.settings("lists.delete.success"))
    },
    onError() {
      toast.error(t.settings("lists.delete.error"))
    },
    onMutate() {
      currentModal?.dismiss()
    },
  })

  return (
    <div className="w-[540px]">
      <div className="mb-4">
        <i className="i-mingcute-warning-fill -mb-1 mr-1 size-5 text-red-500" />
        {t.settings("lists.delete.warning")}
      </div>
      <div className="flex justify-end">
        <Button buttonClassName="bg-red-600" onClick={() => deleteFeedList.mutate({ listId })}>
          {t("words.confirm")}
        </Button>
      </div>
    </div>
  )
}

export const SettingLists = () => {
  const t = useI18n()
  const { isLoading } = usePrefetchLists()
  const ownedLists = useOwnedLists()
  const listDataMap = useMemo(() => {
    if (!ownedLists) return {}
    return ownedLists?.reduce(
      (acc, curr) => {
        acc[curr.id] = {
          id: curr.id,
          subscriptionCount: curr.subscriptionCount,
        }
        return acc
      },
      {} as Record<
        string,
        {
          id: string
          subscriptionCount: number | null | undefined
        }
      >,
    )
  }, [ownedLists])

  const { present } = useModalStack()

  return (
    <section className="mt-4">
      <div className="mb-4 space-y-2 text-sm">
        <p>{t.settings("lists.info")}</p>
      </div>
      <Button
        onClick={() => {
          present({
            title: t.settings("lists.create"),
            content: () => <ListCreationModalContent />,
          })
        }}
      >
        <i className="i-mgc-add-cute-re mr-1 text-base" />
        {t.settings("lists.create")}
      </Button>
      <Divider className="mb-6 mt-8" />
      <div className="flex flex-1 flex-col">
        {isLoading && ownedLists.length === 0 && (
          <LoadingCircle size="large" className="center absolute inset-0" />
        )}

        {isLoading && ownedLists.length > 0 && (
          <LoadingCircle size="small" className="center absolute right-0" />
        )}
        {!!ownedLists && (
          <ScrollArea.ScrollArea viewportClassName="max-h-[380px]">
            {ownedLists.length > 0 ? (
              <div className="overflow-auto">
                <Table className="mt-4">
                  <TableHeader className="border-b">
                    <TableRow className="[&_*]:!font-semibold">
                      <TableHead size="sm">{t.settings("lists.title")}</TableHead>
                      <TableHead size="sm">{t.settings("lists.view")}</TableHead>
                      <TableHead size="sm">{t.settings("lists.subscriptions")}</TableHead>
                      <TableHead size="sm" className="center">
                        {t.common("words.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="border-t-[12px] border-transparent [&_td]:!px-3">
                    {ownedLists.map((row) => (
                      <TableRow key={row.title} className="h-8">
                        <TableCell size="sm">
                          <a
                            target="_blank"
                            href={UrlBuilder.shareList(row.id)}
                            className="inline-flex items-center gap-2 font-semibold"
                          >
                            {row.image && (
                              <Avatar className="size-6">
                                <AvatarImage src={row.image} />
                              </Avatar>
                            )}
                            <span className="inline-block max-w-[200px] truncate">{row.title}</span>
                          </a>
                        </TableCell>
                        <TableCell size="sm">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className={cn(
                                  "inline-flex items-center",
                                  getView(row.view)?.className,
                                )}
                              >
                                {getView(row.view)?.icon}
                              </span>
                            </TooltipTrigger>
                            <TooltipPortal>
                              <TooltipContent>
                                {t(getView(row.view)!.name, {
                                  ns: "common",
                                })}
                              </TooltipContent>
                            </TooltipPortal>
                          </Tooltip>
                        </TableCell>
                        <TableCell size="sm" className="tabular-nums">
                          {formatNumber(listDataMap[row.id]?.subscriptionCount || 0)}
                        </TableCell>
                        <TableCell size="sm" className="center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                onClick={() => {
                                  present({
                                    title: t.settings("lists.feeds.manage"),
                                    content: () => <ListFeedsModalContent id={row.id} />,
                                  })
                                }}
                              >
                                <i className="i-mgc-inbox-cute-re" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipPortal>
                              <TooltipContent>{t.common("words.manage")}</TooltipContent>
                            </TooltipPortal>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                onClick={() => {
                                  present({
                                    title: t.settings("lists.edit.label"),
                                    content: () => <ListCreationModalContent id={row.id} />,
                                  })
                                }}
                              >
                                <i className="i-mgc-edit-cute-re" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipPortal>
                              <TooltipContent>{t.common("words.edit")}</TooltipContent>
                            </TooltipPortal>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <ActionButton
                                size="sm"
                                onClick={() =>
                                  present({
                                    title: t.settings("lists.delete.confirm"),
                                    content: () => <ConfirmDestroyModalContent listId={row.id} />,
                                  })
                                }
                              >
                                <i className="i-mgc-delete-2-cute-re" />
                              </ActionButton>
                            </TooltipTrigger>
                            <TooltipPortal>
                              <TooltipContent>{t.common("words.delete")}</TooltipContent>
                            </TooltipPortal>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="mt-36 w-full text-center text-sm text-zinc-400">
                <p>{t.settings("lists.noLists")}</p>
              </div>
            )}
          </ScrollArea.ScrollArea>
        )}
      </div>
    </section>
  )
}
