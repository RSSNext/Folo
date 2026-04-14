const DEFAULT_CODE_SIGNING_KEY_ID = "main"
const SUPPORTED_CODE_SIGNING_ALG = "rsa-v1_5-sha256"

let cachedPrivateKeyPem: string | null = null
let cachedPrivateKeyPromise: Promise<CryptoKey> | null = null

export class OtaCodeSigningError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "OtaCodeSigningError"
    this.status = status
  }
}

export async function createExpoSignatureHeader(input: {
  manifestBody: string
  expectSignatureHeader: string | undefined
  privateKeyPem?: string | null
}) {
  if (!input.expectSignatureHeader) {
    return null
  }

  const signatureRequest = parseExpoExpectSignatureHeader(input.expectSignatureHeader)
  if (signatureRequest.keyId !== DEFAULT_CODE_SIGNING_KEY_ID) {
    throw new OtaCodeSigningError(
      400,
      `Unsupported expo-expect-signature keyid "${signatureRequest.keyId}"`,
    )
  }

  if (signatureRequest.alg !== SUPPORTED_CODE_SIGNING_ALG) {
    throw new OtaCodeSigningError(
      400,
      `Unsupported expo-expect-signature alg "${signatureRequest.alg}"`,
    )
  }

  const privateKeyPem = input.privateKeyPem?.trim()
  if (!privateKeyPem) {
    throw new OtaCodeSigningError(500, "OTA code signing is not configured")
  }

  const privateKey = await importPrivateKey(privateKeyPem)
  const manifestBuffer = new TextEncoder().encode(input.manifestBody)
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, manifestBuffer)

  return serializeExpoSignatureHeader({
    sig: Buffer.from(signature).toString("base64"),
    keyid: signatureRequest.keyId,
    alg: signatureRequest.alg,
  })
}

function parseExpoExpectSignatureHeader(value: string) {
  const keyIdMatch = value.match(/\bkeyid="?([^",]+)"?/i)
  const algMatch = value.match(/\balg="?([^",]+)"?/i)

  return {
    keyId: keyIdMatch?.[1] ?? DEFAULT_CODE_SIGNING_KEY_ID,
    alg: algMatch?.[1] ?? SUPPORTED_CODE_SIGNING_ALG,
  }
}

function serializeExpoSignatureHeader(input: { sig: string; keyid: string; alg: string }) {
  return Object.entries(input)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join(", ")
}

async function importPrivateKey(privateKeyPem: string) {
  if (cachedPrivateKeyPromise && cachedPrivateKeyPem === privateKeyPem) {
    return cachedPrivateKeyPromise
  }

  cachedPrivateKeyPem = privateKeyPem
  cachedPrivateKeyPromise = crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKeyPem),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  )

  return cachedPrivateKeyPromise
}

function pemToArrayBuffer(value: string) {
  const normalized = value
    .replaceAll("-----BEGIN PRIVATE KEY-----", "")
    .replaceAll("-----END PRIVATE KEY-----", "")
    .replaceAll(/\s+/g, "")

  const buffer = Buffer.from(normalized, "base64")
  return Uint8Array.from(buffer).buffer
}
