import { useEffect, useRef } from "react"
import { useSearchParams } from "react-router"

import { useFollow } from "~/hooks/biz/useFollow"

export const ExternalJumpInProvider = () => {
  // ?follow=${id}&follow_type=list
  const [searchParams, setSearchParams] = useSearchParams()

  const follow = useFollow()
  const onceRef = useRef(false)
  useEffect(() => {
    if (onceRef.current) {
      return
    }

    const followId = searchParams.get("follow")
    const followType = searchParams.get("follow_type")

    if (followId && followType) {
      follow({
        id: followId,
        isList: followType === "list",
      })
      setSearchParams((prev) => {
        prev.delete("follow")
        prev.delete("follow_type")
        return new URLSearchParams(prev)
      })
    }

    onceRef.current = true
  }, [follow, searchParams, setSearchParams])

  return null
}
