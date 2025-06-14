import { getBackgroundGradient } from "@follow/utils/color"
import * as React from "react"

export const OGCanvas = ({ children, seed }: { children: React.ReactNode; seed: string }) => {
  const [bgAccent, bgAccentLight] = getBackgroundGradient(seed)

  return (
    <div
      style={{
        background: `linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #2d2d2d 100%)`,
        width: "100%",
        height: "100%",
        display: "flex",
        textAlign: "center",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {/* Subtle background pattern */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: `radial-gradient(circle at 20% 80%, ${bgAccent}15 0%, transparent 50%), radial-gradient(circle at 80% 20%, ${bgAccentLight}10 0%, transparent 50%)`,
          opacity: 0.6,
        }}
      />

      {/* Grid pattern overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: "radial-gradient(circle, #ffffff08 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.3,
        }}
      />

      {/* Main content card */}
      <div
        style={{
          position: "relative",
          width: "calc(100% - 100px)",
          height: "calc(100% - 100px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(145deg, #ffffff 0%, #fafafa 100%)",
          borderRadius: 32,
          border: "1px solid #e5e5e5",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)",
          gap: "3rem",
          padding: "3rem",
        }}
      >
        {/* Brand mark */}
        <div
          style={{
            position: "absolute",
            right: 32,
            bottom: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            opacity: 0.8,
          }}
        >
          <FollowIcon />
          <span
            style={{
              fontSize: "2rem",
              color: "#FF5C02",
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            Folo
          </span>
        </div>

        {children}
      </div>
    </div>
  )
}

function FollowIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 91 89" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="91" height="89" rx="26" fill="#FF5C02" />
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
  const [, , , bgAccent, bgAccentLight, bgAccentUltraLight] = getBackgroundGradient(title)
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
              width: 180,
              height: 180,
              borderRadius: "50%",
              border: "4px solid #ffffff",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          />
        </div>
      ) : (
        <div
          style={{
            position: "relative",
            width: 180,
            height: 180,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `linear-gradient(135deg, ${bgAccent} 0%, ${bgAccentLight} 50%, ${bgAccentUltraLight} 100%)`,
            border: "4px solid #ffffff",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          }}
        >
          <span
            style={{
              fontSize: 72,
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
