import { ActionButton } from "@follow/components/ui/button/index.js"
import { FeedViewType } from "@follow/constants"
import { useIsListSubscription } from "@follow/store/subscription/hooks"
import { stopPropagation } from "@follow/utils/dom"
import { cn } from "@follow/utils/utils"
import type { FC, PropsWithChildren } from "react"
import { memo, useCallback, useMemo, useRef, useState } from "react"
import { Trans } from "react-i18next"
import { useDebounceCallback } from "usehooks-ts"

import { SafeFragment } from "~/components/common/Fragment"
import { RelativeDay } from "~/components/ui/datetime"
import { IconScaleTransition } from "~/components/ux/transition/icon"
import { useFeature } from "~/hooks/biz/useFeature"
import { getRouteParams, useRouteParams } from "~/hooks/biz/useRouteParams"

import { markAllByRoute } from "../hooks/useMarkAll"

interface DateItemInnerProps {
  date: Date
  startTime: number
  endTime: number
  className?: string
  Wrapper?: FC<PropsWithChildren>
  isSticky?: boolean
}

type DateItemProps = Pick<DateItemInnerProps, "isSticky"> & {
  view: FeedViewType
  date: string
  className?: string
}
const useParseDate = (date: string) =>
  useMemo(() => {
    const dateObj = new Date(date)
    return {
      dateObj,
      startOfDay: new Date(dateObj.setHours(0, 0, 0, 0)).getTime(),
      endOfDay: new Date(dateObj.setHours(23, 59, 59, 999)).getTime(),
    }
  }, [date])

const dateItemclassName = tw`relative flex items-center text-sm lg:text-base gap-1 px-4 font-bold text-text h-7`
export const DateItem = memo(({ date, view, isSticky }: DateItemProps) => {
  const aiEnabled = useFeature("ai")
  if (view === FeedViewType.SocialMedia || aiEnabled) {
    return <SocialMediaDateItem date={date} className={dateItemclassName} isSticky={isSticky} />
  }
  return <UniversalDateItem date={date} className={dateItemclassName} isSticky={isSticky} />
})
const UniversalDateItem = ({ date, className, isSticky }: Omit<DateItemProps, "view">) => {
  const { startOfDay, endOfDay, dateObj } = useParseDate(date)

  return (
    <DateItemInner
      className={className}
      date={dateObj}
      startTime={startOfDay}
      endTime={endOfDay}
      isSticky={isSticky}
    />
  )
}

const DateItemInner: FC<DateItemInnerProps> = ({
  date,
  endTime,
  startTime,
  className,
  Wrapper,
  isSticky,
}) => {
  const [confirmMark, setConfirmMark] = useState(false)
  const removeConfirm = useDebounceCallback(
    () => {
      setConfirmMark(false)
    },
    1000,
    {
      leading: false,
    },
  )

  const timerRef = useRef<any>(undefined)
  const W = Wrapper ?? SafeFragment

  const { feedId } = useRouteParams()
  const isList = useIsListSubscription(feedId)

  const RelativeElement = (
    <span key="b" className="inline-flex items-center">
      <RelativeDay date={date} />
    </span>
  )
  return (
    <div
      className={cn(className, isSticky && "bg-background border-b")}
      onClick={stopPropagation}
      onMouseEnter={removeConfirm.cancel}
      onMouseLeave={removeConfirm}
    >
      <W>
        <ActionButton
          tooltip={
            <span>
              <Trans
                i18nKey="mark_all_read_button.mark_as_read"
                components={{
                  which: RelativeElement,
                }}
              />
            </span>
          }
          onClick={() => {
            if (confirmMark) {
              clearTimeout(timerRef.current)
              markAllByRoute(getRouteParams(), {
                startTime,
                endTime,
              })
              setConfirmMark(false)
            } else {
              setConfirmMark(true)
            }
          }}
          className={cn("size-7 text-base", isList && "pointer-events-none opacity-0")}
        >
          <IconScaleTransition
            icon1="i-mgc-check-filled text-green-600"
            icon2="i-mgc-check-circle-cute-re"
            status={!confirmMark ? "done" : "init"}
          />
        </ActionButton>

        {confirmMark ? (
          <div className="animate-mask-in" key="a">
            <Trans
              i18nKey="mark_all_read_button.confirm_mark_all"
              components={{
                which: <>{RelativeElement}</>,
              }}
            />
          </div>
        ) : (
          RelativeElement
        )}
      </W>
    </div>
  )
}
const SocialMediaDateItem = ({
  date,
  className,
  isSticky,
}: {
  date: string
  className?: string
  isSticky?: boolean
}) => {
  const { startOfDay, endOfDay, dateObj } = useParseDate(date)

  return (
    <DateItemInner
      // @ts-expect-error
      Wrapper={useCallback(
        ({ children }) => (
          <div className="m-auto flex w-[645px] max-w-full select-none gap-3 pl-5 text-base lg:text-lg">
            {children}
          </div>
        ),
        [],
      )}
      className={className}
      date={dateObj}
      startTime={startOfDay}
      endTime={endOfDay}
      isSticky={isSticky}
    />
  )
}
