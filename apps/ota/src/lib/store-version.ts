import type { DesktopDistribution } from "./schema"

const APPLE_APP_STORE_ID = "6739802604"
const GOOGLE_PLAY_PACKAGE_ID = "is.follow"
const MICROSOFT_STORE_PRODUCT_ID = "9nvfzpv0v0ht"
const MICROSOFT_STORE_MARKET = "US"
const MICROSOFT_STORE_LOCALE = "en-US"
const MICROSOFT_STORE_RING = "Retail"
const PLAY_VERSION_PATTERN = /\[\[\["(\d+\.\d+\.\d+)"\]\],\[\[\[36\]\]/
const APPLE_VERSION_PATTERN = /"primarySubtitle":"Version (\d+\.\d+\.\d+)"/
const MICROSOFT_VERSION_PATTERN = /^\d+(?:\.\d+)+$/

export type MobileStorePlatform = "ios" | "android"

export const STORE_URLS = {
  ios: `https://apps.apple.com/us/app/folo-follow-everything/id${APPLE_APP_STORE_ID}`,
  android: `https://play.google.com/store/apps/details?id=${GOOGLE_PLAY_PACKAGE_ID}`,
  mas: `https://apps.apple.com/us/app/folo-follow-everything/id${APPLE_APP_STORE_ID}?platform=mac`,
  mss: `https://apps.microsoft.com/detail/${MICROSOFT_STORE_PRODUCT_ID}?mode=direct`,
} as const

const STORE_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
}

export async function fetchMobileStoreVersion(
  platform: MobileStorePlatform,
): Promise<string | null> {
  switch (platform) {
    case "ios": {
      return fetchIosStoreVersion()
    }
    case "android": {
      return fetchGooglePlayVersion()
    }
  }
}

export async function fetchDesktopStoreVersion(
  distribution: DesktopDistribution,
): Promise<{ version: string | null; storeUrl: string | null }> {
  switch (distribution) {
    case "direct": {
      return { version: null, storeUrl: null }
    }
    case "mas": {
      return {
        version: await fetchMacAppStoreVersion(),
        storeUrl: STORE_URLS.mas,
      }
    }
    case "mss": {
      return {
        version: await fetchMicrosoftStoreVersion(),
        storeUrl: STORE_URLS.mss,
      }
    }
  }
}

export function getDesktopStoreUrl(distribution: DesktopDistribution) {
  switch (distribution) {
    case "direct": {
      return null
    }
    case "mas": {
      return STORE_URLS.mas
    }
    case "mss": {
      return STORE_URLS.mss
    }
  }
}

async function fetchIosStoreVersion() {
  const response = await fetch(`https://itunes.apple.com/lookup?id=${APPLE_APP_STORE_ID}`, {
    headers: STORE_HEADERS,
  })
  if (!response.ok) {
    throw new Error(`App Store lookup failed (${response.status})`)
  }

  const payload = (await response.json()) as {
    results?: Array<{
      version?: unknown
    }>
  }

  const version = payload.results?.[0]?.version
  return typeof version === "string" ? version : null
}

async function fetchGooglePlayVersion() {
  const response = await fetch(`${STORE_URLS.android}&hl=en_US&gl=US`, {
    headers: STORE_HEADERS,
  })
  if (!response.ok) {
    throw new Error(`Google Play storefront request failed (${response.status})`)
  }

  const html = await response.text()
  return html.match(PLAY_VERSION_PATTERN)?.[1] ?? null
}

async function fetchMacAppStoreVersion() {
  const response = await fetch(STORE_URLS.mas, {
    headers: STORE_HEADERS,
  })
  if (!response.ok) {
    throw new Error(`Mac App Store storefront request failed (${response.status})`)
  }

  const html = await response.text()
  return html.match(APPLE_VERSION_PATTERN)?.[1] ?? null
}

async function fetchMicrosoftStoreVersion() {
  const productPayload = await fetchJson<{
    Payload?: {
      Skus?: Array<{
        FulfillmentData?: string
      }>
    }
  }>(
    `https://storeedgefd.dsx.mp.microsoft.com/v9.0/products/${MICROSOFT_STORE_PRODUCT_ID}?market=${MICROSOFT_STORE_MARKET}&locale=${MICROSOFT_STORE_LOCALE}&deviceFamily=Windows.Desktop`,
    "Microsoft Store products request",
  )

  const fulfillmentData = resolveMicrosoftFulfillmentData(productPayload)
  if (!fulfillmentData) {
    throw new Error("Microsoft Store products response did not include FulfillmentData")
  }

  const cookieResponse = await fetch(
    "https://fe3.delivery.mp.microsoft.com/ClientWebService/client.asmx",
    {
      method: "POST",
      headers: {
        "content-type": "application/soap+xml; charset=utf-8",
      },
      body: buildCookieEnvelope(),
    },
  )

  if (!cookieResponse.ok) {
    throw new Error(`Microsoft Store cookie request failed (${cookieResponse.status})`)
  }

  const cookie = extractXmlTag(await cookieResponse.text(), "EncryptedData")
  if (!cookie) {
    throw new Error("Microsoft Store cookie response did not include EncryptedData")
  }

  const syncResponse = await fetch(
    "https://fe3.delivery.mp.microsoft.com/ClientWebService/client.asmx",
    {
      method: "POST",
      headers: {
        "content-type": "application/soap+xml; charset=utf-8",
      },
      body: buildSyncUpdatesEnvelope(cookie, fulfillmentData.WuCategoryId, MICROSOFT_STORE_RING),
    },
  )

  if (!syncResponse.ok) {
    throw new Error(`Microsoft Store sync request failed (${syncResponse.status})`)
  }

  const versions = collectVersionsFromSync(
    await syncResponse.text(),
    fulfillmentData.PackageFamilyName,
  )

  return normalizeMicrosoftVersion(versions.at(-1) ?? null)
}

async function fetchJson<T>(url: string, context: string): Promise<T> {
  const response = await fetch(url, {
    headers: STORE_HEADERS,
  })
  if (!response.ok) {
    throw new Error(`${context} failed (${response.status})`)
  }

  return (await response.json()) as T
}

function resolveMicrosoftFulfillmentData(payload: {
  Payload?: {
    Skus?: Array<{
      FulfillmentData?: string
    }>
  }
}) {
  const skuList = payload.Payload?.Skus
  if (!Array.isArray(skuList)) {
    return null
  }

  for (const sku of skuList) {
    if (typeof sku?.FulfillmentData !== "string" || sku.FulfillmentData.length === 0) {
      continue
    }

    const fulfillmentData = JSON.parse(sku.FulfillmentData) as {
      WuCategoryId?: unknown
      PackageFamilyName?: unknown
    }

    if (
      typeof fulfillmentData.WuCategoryId === "string" &&
      fulfillmentData.WuCategoryId.length > 0 &&
      typeof fulfillmentData.PackageFamilyName === "string" &&
      fulfillmentData.PackageFamilyName.length > 0
    ) {
      return {
        WuCategoryId: fulfillmentData.WuCategoryId,
        PackageFamilyName: fulfillmentData.PackageFamilyName,
      }
    }
  }

  return null
}

function buildCookieEnvelope() {
  return `<?xml version="1.0" encoding="utf-8"?>
<Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns="http://www.w3.org/2003/05/soap-envelope">
  <Header>
    <Action xmlns="http://www.w3.org/2005/08/addressing" xmlns:s="http://www.w3.org/2003/05/soap-envelope" s:mustUnderstand="1">http://www.microsoft.com/SoftwareDistribution/Server/ClientWebService/GetCookie</Action>
    <MessageID xmlns="http://www.w3.org/2005/08/addressing">urn:uuid:b9b43757-2247-4d7b-ae8f-a71ba8a22386</MessageID>
    <To xmlns="http://www.w3.org/2005/08/addressing" xmlns:s="http://www.w3.org/2003/05/soap-envelope" s:mustUnderstand="1">https://fe3.delivery.mp.microsoft.com/ClientWebService/client.asmx</To>
    <Security xmlns="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:s="http://www.w3.org/2003/05/soap-envelope" s:mustUnderstand="1">
      <Timestamp xmlns="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
        <Created>2017-12-02T00:16:15.210Z</Created>
        <Expires>2017-12-29T06:25:43.943Z</Expires>
      </Timestamp>
      <WindowsUpdateTicketsToken xmlns="http://schemas.microsoft.com/msus/2014/10/WindowsUpdateAuthorization" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" u:id="ClientMSA">
        <TicketType Name="MSA" Version="1.0" Policy="MBI_SSL">
          <User />
        </TicketType>
      </WindowsUpdateTicketsToken>
    </Security>
  </Header>
  <Body>
    <GetCookie xmlns="http://www.microsoft.com/SoftwareDistribution/Server/ClientWebService">
      <oldCookie></oldCookie>
      <lastChange>2015-10-21T17:01:07.1472913Z</lastChange>
      <currentTime>2017-12-02T00:16:15.217Z</currentTime>
      <protocolVersion>1.40</protocolVersion>
    </GetCookie>
  </Body>
</Envelope>`
}

function buildSyncUpdatesEnvelope(cookie: string, categoryId: string, ring: string) {
  return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:a="http://www.w3.org/2005/08/addressing" xmlns:s="http://www.w3.org/2003/05/soap-envelope">
  <s:Header>
    <a:Action s:mustUnderstand="1">http://www.microsoft.com/SoftwareDistribution/Server/ClientWebService/SyncUpdates</a:Action>
    <a:MessageID>urn:uuid:175df68c-4b91-41ee-b70b-f2208c65438e</a:MessageID>
    <a:To s:mustUnderstand="1">https://fe3.delivery.mp.microsoft.com/ClientWebService/client.asmx</a:To>
    <o:Security xmlns:o="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" s:mustUnderstand="1">
      <Timestamp xmlns="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
        <Created>2017-08-05T02:03:05.038Z</Created>
        <Expires>2017-08-05T02:08:05.038Z</Expires>
      </Timestamp>
      <wuws:WindowsUpdateTicketsToken xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" xmlns:wuws="http://schemas.microsoft.com/msus/2014/10/WindowsUpdateAuthorization" wsu:id="ClientMSA">
        <TicketType Name="MSA" Version="1.0" Policy="MBI_SSL">
          <Device>dAA9AEUAdwBBAHcAQQBzAE4AMwBCAEEAQQBVADEAYgB5AHMAZQBtAGIAZQBEAFYAQwArADMAZgBtADcAbwBXAHkASAA3AGIAbgBnAEcAWQBtAEEAQQBMAGoAbQBqAFYAVQB2AFEAYwA0AEsAVwBFAC8AYwBDAEwANQBYAGUANABnAHYAWABkAGkAegBHAGwAZABjADEAZAAvAFcAeQAvAHgASgBQAG4AVwBRAGUAYwBtAHYAbwBjAGkAZwA5AGoAZABwAE4AawBIAG0AYQBzAHAAVABKAEwARAArAFAAYwBBAFgAbQAvAFQAcAA3AEgAagBzAEYANAA0AEgAdABsAC8AMQBtAHUAcgAwAFMAdQBtAG8AMABZAGEAdgBqAFIANwArADQAcABoAC8AcwA4ADEANgBFAFkANQBNAFIAbQBnAFIAQwA2ADMAQwBSAEoAQQBVAHYAZgBzADQAaQB2AHgAYwB5AEwAbAA2AHoAOABlAHgAMABrAFgAOQBPAHcAYQB0ADEAdQBwAFMAOAAxAEgANgA4AEEASABzAEoAegBnAFQAQQBMAG8AbgBBADIAWQBBAEEAQQBpAGcANQBJADMAUQAvAFYASABLAHcANABBAEIAcQA5AFMAcQBhADEAQgA4AGsAVQAxAGEAbwBLAEEAdQA0AHYAbABWAG4AdwBWADMAUQB6AHMATgBtAEQAaQBqAGgANQBkAEcAcgBpADgAQQBlAEUARQBWAEcAbQBXAGgASQBCAE0AUAAyAEQAVwA0ADMAZABWAGkARABUAHoAVQB0AHQARQBMAEgAaABSAGYAcgBhAGIAWgBsAHQAQQBUAEUATABmAHMARQBGAFUAYQBRAFMASgB4ADUAeQBRADgAagBaAEUAZQAyAHgANABCADMAMQB2AEIAMgBqAC8AUgBLAGEAWQAvAHEAeQB0AHoANwBUAHYAdAB3AHQAagBzADYAUQBYAEIAZQA4AHMAZwBJAG8AOQBiADUAQQBCADcAOAAxAHMANgAvAGQAUwBFAHgATgBEAEQAYQBRAHoAQQBYAFAAWABCAFkAdQBYAFEARQBzAE8AegA4AHQAcgBpAGUATQBiAEIAZQBUAFkAOQBiAG8AQgBOAE8AaQBVADcATgBSAEYAOQAzAG8AVgArAFYAQQBiAGgAcAAwAHAAUgBQAFMAZQBmAEcARwBPAHEAdwBTAGcANwA3AHMAaAA5AEoASABNAHAARABNAFMAbgBrAHEAcgAyAGYARgBpAEMAUABrAHcAVgBvAHgANgBuAG4AeABGAEQAbwBXAC8AYQAxAHQAYQBaAHcAegB5AGwATABMADEAMgB3AHUAYgBtADUAdQBtAHAAcQB5AFcAYwBLAFIAagB5AGgAMgBKAFQARgBKAFcANQBnAFgARQBJADUAcAA4ADAARwB1ADIAbgB4AEwAUgBOAHcAaQB3AHIANwBXAE0AUgBBAFYASwBGAFcATQBlAFIAegBsADkAVQBxAGcALwBwAFgALwB2AGUATAB3AFMAawAyAFMAUwBIAGYAYQBLADYAagBhAG8AWQB1AG4AUgBHAHIAOABtAGIARQBvAEgAbABGADYASgBDAGEAYQBUAEIAWABCAGMAdgB1AGUAQwBKAG8AOQA4AGgAUgBBAHIARwB3ADQAKwBQAEgAZQBUAGIATgBTAEUAWABYAHoAdgBaADYAdQBXADUARQBBAGYAZABaAG0AUwA4ADgAVgBKAGMAWgBhAEYASwA3AHgAeABnADAAdwBvAG4ANwBoADAAeABDADYAWgBCADAAYwBZAGoATAByAC8ARwBlAE8AegA5AEcANABRAFUASAA5AEUAawB5ADAAZAB5AEYALwByAGUAVQAxAEkAeQBpAGEAcABwAGgATwBQADgAUwAyAHQANABCAHIAUABaAFgAVAB2AEMAMABQADcAegBPACsAZgBHAGsAeABWAG0AKwBVAGYAWgBiAFEANQA1AHMAdwBFAD0AJgBwAD0A</Device>
        </TicketType>
      </wuws:WindowsUpdateTicketsToken>
    </o:Security>
  </s:Header>
  <s:Body>
    <SyncUpdates xmlns="http://www.microsoft.com/SoftwareDistribution/Server/ClientWebService">
      <cookie>
        <Expiration>2045-03-11T02:02:48Z</Expiration>
        <EncryptedData>${cookie}</EncryptedData>
      </cookie>
      <parameters>
        <ExpressQuery>false</ExpressQuery>
        <InstalledNonLeafUpdateIDs>
          <int>1</int>
          <int>2</int>
          <int>3</int>
          <int>11</int>
          <int>19</int>
          <int>544</int>
          <int>549</int>
          <int>2359974</int>
          <int>2359977</int>
          <int>5169044</int>
          <int>8788830</int>
          <int>23110993</int>
          <int>23110994</int>
          <int>54341900</int>
          <int>54343656</int>
          <int>59830006</int>
          <int>59830007</int>
          <int>59830008</int>
          <int>60484010</int>
          <int>62450018</int>
          <int>62450019</int>
          <int>62450020</int>
          <int>66027979</int>
          <int>66053150</int>
          <int>97657898</int>
          <int>98822896</int>
          <int>98959022</int>
          <int>98959023</int>
          <int>98959024</int>
          <int>98959025</int>
          <int>98959026</int>
          <int>104433538</int>
          <int>104900364</int>
          <int>105489019</int>
          <int>117765322</int>
          <int>129905029</int>
          <int>130040031</int>
          <int>132387090</int>
          <int>132393049</int>
          <int>133399034</int>
          <int>138537048</int>
          <int>140377312</int>
          <int>143747671</int>
          <int>158941041</int>
          <int>158941042</int>
          <int>158941043</int>
          <int>158941044</int>
        </InstalledNonLeafUpdateIDs>
        <OtherCachedUpdateIDs></OtherCachedUpdateIDs>
        <SkipSoftwareSync>false</SkipSoftwareSync>
        <NeedTwoGroupOutOfScopeUpdates>true</NeedTwoGroupOutOfScopeUpdates>
        <FilterAppCategoryIds>
          <CategoryIdentifier>
            <Id>${categoryId}</Id>
          </CategoryIdentifier>
        </FilterAppCategoryIds>
        <TreatAppCategoryIdsAsInstalled>true</TreatAppCategoryIdsAsInstalled>
        <AlsoPerformRegularSync>false</AlsoPerformRegularSync>
        <ComputerSpec />
        <ExtendedUpdateInfoParameters>
          <XmlUpdateFragmentTypes>
            <XmlUpdateFragmentType>Extended</XmlUpdateFragmentType>
          </XmlUpdateFragmentTypes>
        </ExtendedUpdateInfoParameters>
        <ProductsParameters>
          <SyncCurrentVersionOnly>false</SyncCurrentVersionOnly>
          <DeviceAttributes>FlightRing=${ring};DeviceFamily=Windows.Desktop;</DeviceAttributes>
          <CallerAttributes>Interactive=1;IsSeeker=0;</CallerAttributes>
          <Products />
        </ProductsParameters>
      </parameters>
    </SyncUpdates>
  </s:Body>
</s:Envelope>`
}

function collectVersionsFromSync(syncXml: string, packageFamilyName: string) {
  const decodedXml = decodeXmlEntities(syncXml)
  const separatorIndex = packageFamilyName.lastIndexOf("_")

  if (separatorIndex <= 0) {
    return []
  }

  const packageName = packageFamilyName.slice(0, separatorIndex)
  const publisherId = packageFamilyName.slice(separatorIndex + 1)
  const patterns = [
    new RegExp(
      `PackageMoniker="${escapeRegExp(packageName)}_([0-9]+(?:\\.[0-9]+)+)_[^"]*__${escapeRegExp(publisherId)}"`,
      "g",
    ),
    new RegExp(
      `InstallerSpecificIdentifier="${escapeRegExp(packageName)}_([0-9]+(?:\\.[0-9]+)+)_[^"]*__${escapeRegExp(publisherId)}"`,
      "g",
    ),
  ]

  const versions = new Set<string>()

  for (const pattern of patterns) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(decodedXml)) !== null) {
      const version = match[1]
      if (typeof version === "string" && MICROSOFT_VERSION_PATTERN.test(version)) {
        versions.add(version)
      }
    }
  }

  return [...versions].sort(compareStoreVersion)
}

function extractXmlTag(text: string, tagName: string) {
  const match = text.match(new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, "i"))
  return match?.[1] ?? ""
}

function decodeXmlEntities(text: string) {
  return text
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&")
}

function escapeRegExp(value: string) {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function normalizeMicrosoftVersion(version: string | null) {
  if (!version) {
    return null
  }

  return version.replace(/\.0$/, "")
}

function compareStoreVersion(left: string, right: string) {
  const leftParts = left.split(".").map(Number)
  const rightParts = right.split(".").map(Number)
  const length = Math.max(leftParts.length, rightParts.length)

  for (let index = 0; index < length; index += 1) {
    const diff = (leftParts[index] ?? 0) - (rightParts[index] ?? 0)
    if (diff !== 0) {
      return diff
    }
  }

  return 0
}
