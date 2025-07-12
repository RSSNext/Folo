import { getBackgroundGradient } from "@follow/utils/color"
import * as React from "react"

export const OGCanvas = ({ children, seed }: { children: React.ReactNode; seed: string }) => {
  const [bgAccent, bgAccentLight] = getBackgroundGradient(seed)

  return (
    <div
      style={{
        background: "#0a0f1a",
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        fontFamily: "SN Pro",
        color: "#e6edf3",
      }}
    >
      {/* Background Grid Pattern */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
      {/* Background Glows */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: `
            radial-gradient(circle at 15% 20%, ${bgAccent}20 0%, transparent 40%),
            radial-gradient(circle at 85% 80%, ${bgAccentLight}15 0%, transparent 40%)
          `,
        }}
      />

      {/* Main layout container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: "40px 60px",
          gap: 40,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          {/* Follow Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <FollowIcon />
            <LogoText />
          </div>

          {/* AI RSS */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20, color: "#afb8c1" }}>Follow everything in one place</span>
            <RSSIcon color={"#F26522"} />
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

function RSSIcon({ color }: { color: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
      <path
        fill={color}
        d="M7.23.01c-2.685.14-4.2.637-5.364 1.76C.835 2.761.339 3.981.089 6.13.01 6.82 0 7.46 0 12.001s.01 5.183.089 5.87c.25 2.149.746 3.369 1.777 4.362 1.02.983 2.167 1.435 4.263 1.678C6.817 23.99 7.458 24 12 24s5.183-.01 5.87-.089c2.097-.243 3.244-.695 4.264-1.678 1.031-.993 1.527-2.213 1.777-4.362.079-.687.089-1.328.089-5.87s-.01-5.182-.089-5.87c-.25-2.149-.746-3.369-1.777-4.362C21.124.795 19.975.34 17.923.096 17.3.023 16.535.01 12.38.002A437 437 0 0 0 7.23.01m1.395 5.7c3.14.345 5.935 1.97 7.721 4.49 1.345 1.896 2.064 4.273 1.985 6.554-.019.545-.042.69-.14.893a1.35 1.35 0 0 1-.783.672c-.32.095-.416.094-.735-.009a1.24 1.24 0 0 1-.767-.687c-.1-.234-.114-.345-.107-.878.03-2.43-.778-4.474-2.426-6.116-1.657-1.652-3.7-2.462-6.118-2.427-.534.008-.642-.005-.875-.106-.474-.206-.739-.615-.739-1.143 0-.62.383-1.096 1.005-1.247.23-.056 1.461-.053 1.979.004m-.522 4.494a7.32 7.319 0 0 1 2.855 1.18 8.71 8.709 0 0 1 1.659 1.658c.775 1.091 1.248 2.51 1.27 3.81.007.381-.012.55-.08.705-.194.447-.7.785-1.174.785-.473 0-.985-.341-1.168-.78-.046-.11-.103-.452-.127-.761-.094-1.195-.47-2.025-1.292-2.847-.822-.821-1.652-1.198-2.847-1.292-.627-.05-.877-.132-1.13-.372a1.25 1.25 0 0 1-.293-1.43c.187-.401.496-.64.971-.754.151-.035.852.015 1.356.098m.219 4.505c.397.182.789.57.971.965.125.267.144.372.144.766s-.02.499-.142.761a2.15 2.15 0 0 1-.97.973c-.266.125-.371.144-.766.144-.393 0-.498-.02-.76-.142a2.15 2.15 0 0 1-.974-.97c-.124-.266-.143-.371-.143-.766 0-.405.018-.493.157-.786.346-.727 1.009-1.133 1.798-1.1.283.012.459.052.685.155"
      />
    </svg>
  )
}

function FollowIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
      <path
        fill="#ff5c00"
        d="M5.382 0h13.236A5.37 5.37 0 0 1 24 5.383v13.235A5.37 5.37 0 0 1 18.618 24H5.382A5.37 5.37 0 0 1 0 18.618V5.383A5.37 5.37 0 0 1 5.382.001Z"
      />
      <path
        fill="#fff"
        d="M13.269 17.31a1.813 1.813 0 1 0-3.626.002 1.813 1.813 0 0 0 3.626-.002m-.535-6.527H7.213a1.813 1.813 0 1 0 0 3.624h5.521a1.813 1.813 0 1 0 0-3.624m4.417-4.712H8.87a1.813 1.813 0 1 0 0 3.625h8.283a1.813 1.813 0 1 0 0-3.624z"
      />
    </svg>
  )
}

function LogoText() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M.899 16.997c-.567 0-.899-.358-.899-.994v-7.77c0-.637.36-.996 1.01-.996h4.34c.595 0 .927.29.927.788 0 .497-.332.774-.926.774H1.797v2.336H5.06c.595 0 .927.263.927.76 0 .512-.332.775-.927.775H1.797v3.332c0 .636-.318.996-.898.996m9.035.125c-2.101 0-3.553-1.52-3.553-3.664 0-2.17 1.438-3.705 3.553-3.705 2.13 0 3.567 1.534 3.567 3.705 0 2.143-1.452 3.664-3.567 3.664m0-1.493c1.134 0 1.825-.899 1.825-2.185 0-1.3-.691-2.198-1.825-2.198s-1.797.899-1.797 2.198c0 1.286.663 2.185 1.797 2.185m5.266 1.367c-.553 0-.857-.359-.857-.967V7.845c0-.608.304-.968.857-.968s.857.36.857.968v8.185c0 .608-.29.967-.857.967m5.234.125c-2.102 0-3.553-1.52-3.553-3.664 0-2.17 1.438-3.705 3.553-3.705 2.129 0 3.566 1.534 3.566 3.704 0 2.143-1.452 3.664-3.567 3.664m0-1.493c1.134 0 1.825-.899 1.825-2.185 0-1.3-.691-2.198-1.825-2.198s-1.797.899-1.797 2.198c0 1.286.663 2.185 1.797 2.185"
      />
    </svg>
  )
}

export async function getImageBase64(image: string | null | undefined) {
  if (!image) {
    return null
  }

  const url = new URL(image)
  return await fetch(image, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Referer: url.origin,
    },
  }).then(async (res) => {
    const isImage = res.headers.get("content-type")?.startsWith("image/")
    if (isImage) {
      const arrayBuffer = await res.arrayBuffer()

      return `data:${res.headers.get("content-type")};base64,${Buffer.from(arrayBuffer).toString("base64")}`
    }
    return null
  })
}

export const OGAvatar: React.FC<{ base64?: Nullable<string>; title: string }> = ({
  base64,
  title,
}) => {
  const [, , , bgAccent, bgAccentLight] = getBackgroundGradient(title)
  return (
    <>
      {base64 ? (
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={base64}
            style={{
              width: 160,
              height: 160,
              borderRadius: "50%",
              border: `3px solid ${bgAccentLight}50`,
              boxShadow: `0 0 25px ${bgAccent}40`,
            }}
          />
        </div>
      ) : (
        <div
          style={{
            position: "relative",
            width: 160,
            height: 160,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `linear-gradient(135deg, ${bgAccent} 0%, ${bgAccentLight} 100%)`,
            border: `3px solid ${bgAccentLight}50`,
            boxShadow: `0 0 25px ${bgAccent}40`,
          }}
        >
          <span
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: "white",
              letterSpacing: "-0.02em",
            }}
          >
            {title?.[0]}
          </span>
        </div>
      )}
    </>
  )
}
