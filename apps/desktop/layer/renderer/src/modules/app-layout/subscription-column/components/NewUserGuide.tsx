import { lazy, Suspense } from "react"

import { useWhoami } from "~/atoms/user"
import { useAuthQuery } from "~/hooks/common/useBizQuery"
import { settings } from "~/queries/settings"

const LazyNewUserGuideModal = lazy(() =>
  import("~/modules/new-user-guide/modal").then((m) => ({ default: m.NewUserGuideModal })),
)

export function NewUserGuide() {
  const user = useWhoami()
  const { data: remoteSettings, isLoading } = useAuthQuery(settings.get(), {})
  const isNewUser =
    !isLoading && remoteSettings && Object.keys(remoteSettings.updated ?? {}).length === 0

  return user && isNewUser ? (
    <Suspense>
      <LazyNewUserGuideModal />
    </Suspense>
  ) : null
}
