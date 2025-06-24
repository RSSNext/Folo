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
    <svg width="48" height="48" viewBox="0 0 91 89" fill="none">
      <rect width="91" height="89" rx="20" fill="#FF5C02" />
      <path
        d="M69.0242 22.0703H37.1962C33.3473 22.0703 30.2272 25.1785 30.2272 29.0126C30.2272 32.8468 33.3473 35.955 37.1962 35.955H69.0242C72.8731 35.955 75.9933 32.8468 75.9933 29.0126C75.9933 25.1785 72.8731 22.0703 69.0242 22.0703Z"
        fill="white"
      />
      <path
        d="M50.6595 40.1356H26.7962C22.9473 40.1356 19.8271 43.2438 19.8271 47.0779C19.8271 50.9121 22.9473 54.0202 26.7962 54.0202H50.6595C54.5084 54.0202 57.6286 50.9121 57.6286 47.0779C57.6286 43.2438 54.5084 40.1356 50.6595 40.1356Z"
        fill="white"
      />
      <path
        d="M51.1344 65.128C51.1344 61.2938 48.0142 58.1857 44.1653 58.1857C40.3164 58.1857 37.1962 61.2938 37.1962 65.128C37.1962 68.9621 40.3164 72.0703 44.1653 72.0703C48.0142 72.0703 51.1344 68.9621 51.1344 65.128Z"
        fill="white"
      />
    </svg>
  )
}

function LogoText() {
  return (
    <svg
      // width="115"
      height="30"
      viewBox="0 0 115 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M97.4813 49.2552C87.5432 49.2552 80.678 42.0631 80.678 31.9288C80.678 21.6637 87.4778 14.4062 97.4813 14.4062C107.55 14.4062 114.35 21.6637 114.35 31.9288C114.35 42.0631 107.485 49.2552 97.4813 49.2552ZM97.4813 42.1939C102.843 42.1939 106.112 37.944 106.112 31.8634C106.112 25.7174 102.843 21.4676 97.4813 21.4676C92.1199 21.4676 88.9816 25.7174 88.9816 31.8634C88.9816 37.944 92.1199 42.1939 97.4813 42.1939Z"
        fill="#fff"
      />
      <path
        d="M72.7289 48.6667C70.1136 48.6667 68.6752 46.9668 68.6752 44.0899V5.38342C68.6752 2.50658 70.1136 0.806641 72.7289 0.806641C75.3442 0.806641 76.7826 2.50658 76.7826 5.38342V44.0899C76.7826 46.9668 75.4096 48.6667 72.7289 48.6667Z"
        fill="#fff"
      />
      <path
        d="M47.8314 49.2552C37.8932 49.2552 31.0281 42.0631 31.0281 31.9288C31.0281 21.6637 37.8279 14.4062 47.8314 14.4062C57.9003 14.4062 64.7001 21.6637 64.7001 31.9288C64.7001 42.0631 57.8349 49.2552 47.8314 49.2552ZM47.8314 42.1939C53.1928 42.1939 56.4619 37.944 56.4619 31.8634C56.4619 25.7174 53.1928 21.4676 47.8314 21.4676C42.47 21.4676 39.3317 25.7174 39.3317 31.8634C39.3317 37.944 42.47 42.1939 47.8314 42.1939Z"
        fill="#fff"
      />
      <path
        d="M5.10235 48.6669C2.42166 48.6669 0.852478 46.967 0.852478 43.9594V7.21438C0.852478 4.20678 2.55243 2.50684 5.62541 2.50684H26.1555C28.967 2.50684 30.5362 3.87987 30.5362 6.23365C30.5362 8.58742 28.967 9.89507 26.1555 9.89507H9.35221V20.9447H24.7825C27.594 20.9447 29.1631 22.187 29.1631 24.5408C29.1631 26.9599 27.594 28.2022 24.7825 28.2022H9.35221V43.9594C9.35221 46.967 7.84842 48.6669 5.10235 48.6669Z"
        fill="#fff"
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
