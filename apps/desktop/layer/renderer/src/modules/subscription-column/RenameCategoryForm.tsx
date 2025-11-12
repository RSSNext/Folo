import { MotionButtonBase } from "@follow/components/ui/button/index.js"
import { ShrinkingFocusBorder } from "@follow/components/ui/shrinking-focus-border/index.js"
import type { FeedViewType } from "@follow/constants"
import { useInputComposition } from "@follow/hooks"
import { subscriptionSyncService } from "@follow/store/subscription/store"
import { nextFrame } from "@follow/utils/dom"
import { useMutation } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useOnClickOutside } from "usehooks-ts"

import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { getRouteParams } from "~/hooks/biz/useRouteParams"
import { createErrorToaster } from "~/lib/error-parser"

export const RenameCategoryForm = ({
  currentCategory,
  view,
  onFinished,
}: {
  currentCategory: string
  view: FeedViewType
  onFinished: () => void
}) => {
  const navigate = useNavigateEntry()
  const { t } = useTranslation()
  const renameMutation = useMutation({
    mutationFn: async ({
      lastCategory,
      newCategory,
    }: {
      lastCategory: string
      newCategory: string
    }) => subscriptionSyncService.renameCategory({ lastCategory, newCategory, view }),
    onMutate({ lastCategory, newCategory }) {
      const routeParams = getRouteParams()

      if (routeParams.folderName === lastCategory) {
        navigate({
          folderName: newCategory,
        })
      }

      onFinished()
    },
    onError: createErrorToaster(t("sidebar.feed_column.context_menu.rename_category_error")),
    onSuccess: () => {
      toast.success(t("sidebar.feed_column.context_menu.rename_category_success"))
    },
  })
  const formRef = useRef<HTMLFormElement | null>(null)
  const [isFocused, setIsFocused] = useState(false)

  useOnClickOutside(
    formRef as React.RefObject<HTMLElement>,
    () => {
      onFinished()
    },
    "mousedown",
  )
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    nextFrame(() => {
      inputRef.current?.focus()
      setIsFocused(true)
    })
  }, [])
  const compositionInputProps = useInputComposition({
    onKeyDown: (e) => {
      if (e.key === "Escape") {
        onFinished()
      }
    },
  })
  return (
    <div className="relative ml-3 flex h-8 w-full items-center">
      <ShrinkingFocusBorder isVisible={isFocused} containerRef={inputRef} persistBorder />
      <form
        ref={formRef}
        className="flex w-full items-center"
        onSubmit={(e) => {
          e.preventDefault()

          return renameMutation.mutateAsync({
            lastCategory: currentCategory!,
            newCategory: e.currentTarget.category.value,
          })
        }}
      >
        <input
          {...compositionInputProps}
          ref={inputRef}
          name="category"
          autoFocus
          defaultValue={currentCategory}
          className="w-full appearance-none bg-transparent px-2 py-1 caret-accent"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        <MotionButtonBase
          type="submit"
          className="center -mr-1 flex size-5 shrink-0 rounded-lg text-green hover:bg-material-ultra-thick"
        >
          <i className="i-mgc-check-filled size-3" />
        </MotionButtonBase>
      </form>
    </div>
  )
}
