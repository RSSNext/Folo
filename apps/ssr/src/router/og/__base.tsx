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
            <RSSIcon color={bgAccent || "#e6edf3"} />
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
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
      <path
        d="M8.24 2.546c-2.117.11-3.311.502-4.229 1.387-.813.783-1.204 1.745-1.401 3.439-.062.542-.07 1.047-.07 4.628 0 3.581.008 4.086.07 4.628.197 1.694.588 2.656 1.401 3.439.804.775 1.708 1.131 3.361 1.323.542.062 1.047.07 4.628.07 3.581 0 4.086-.008 4.628-.07 1.653-.192 2.557-.548 3.361-1.323.813-.783 1.204-1.745 1.401-3.439.062-.542.07-1.047.07-4.628 0-3.581-.008-4.086-.07-4.628-.197-1.694-.588-2.656-1.401-3.439-.796-.768-1.702-1.128-3.32-1.319-.49-.058-1.094-.068-4.369-.074-2.09-.004-3.917-.001-4.06.006m1.1 4.494c2.476.272 4.679 1.553 6.087 3.54 1.06 1.495 1.627 3.369 1.565 5.167-.015.43-.033.544-.11.704a1.06 1.06 0 0 1-.618.53c-.252.075-.328.074-.579-.007a.976.976 0 0 1-.605-.542c-.079-.184-.09-.272-.084-.692.024-1.916-.614-3.527-1.913-4.822-1.306-1.302-2.917-1.941-4.823-1.913-.421.006-.506-.004-.69-.084-.373-.162-.582-.485-.582-.901 0-.489.302-.864.792-.983.181-.044 1.152-.042 1.56.003m-.411 3.543a5.77 5.77 0 0 1 2.25.93 6.866 6.866 0 0 1 1.308 1.308c.611.86.984 1.979 1.002 3.003.005.301-.01.434-.063.556-.154.353-.552.619-.926.619-.373 0-.777-.269-.921-.615-.036-.086-.081-.356-.1-.6-.074-.942-.371-1.596-1.019-2.244-.648-.648-1.302-.945-2.244-1.019-.494-.039-.691-.104-.891-.293a.984.984 0 0 1-.231-1.128c.148-.316.391-.505.766-.594.119-.028.671.012 1.069.077m.172 3.552c.313.143.622.45.766.761.098.21.113.293.113.604 0 .31-.015.393-.112.6a1.698 1.698 0 0 1-.764.767c-.21.098-.293.113-.604.113-.31 0-.393-.015-.6-.112a1.698 1.698 0 0 1-.767-.764c-.098-.21-.113-.293-.113-.604 0-.32.014-.389.124-.62.273-.573.795-.893 1.417-.867.223.009.362.041.54.122"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  )
}

function FollowIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <title>Folo</title>
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
    <svg height="30" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
