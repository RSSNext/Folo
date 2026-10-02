// Usage: node pe-signature.mjs <file.exe>
// Reports whether a Windows PE file carries an Authenticode certificate table and whether that
// table holds the SignPath Foundation certificate Folo installers are signed with. A Squirrel
// installer whose SignPath request timed out prints `signed: false`.
import { fstatSync, openSync, readSync } from "node:fs"

const filePath = process.argv[2]
if (!filePath) {
  console.error("Usage: node pe-signature.mjs <file.exe>")
  process.exit(1)
}

const fd = openSync(filePath, "r")
const read = (offset, length) => {
  const buffer = Buffer.alloc(length)
  readSync(fd, buffer, 0, length, offset)
  return buffer
}

const peOffset = read(0x3c, 4).readUInt32LE(0)
if (read(peOffset, 4).toString("latin1") !== "PE\0\0") {
  console.error(`${filePath} is not a PE file`)
  process.exit(1)
}

// The optional header follows the 4-byte signature and the 20-byte COFF header. The certificate
// table is data directory 4; directories start at offset 96 (PE32) or 112 (PE32+).
const optionalHeader = peOffset + 24
const magic = read(optionalHeader, 2).readUInt16LE(0)
const dataDirectories = optionalHeader + (magic === 0x20b ? 112 : 96)
const certificateEntry = read(dataDirectories + 4 * 8, 8)
const certificateOffset = certificateEntry.readUInt32LE(0)
const certificateSize = certificateEntry.readUInt32LE(4)

const result = {
  signed: certificateSize > 0,
  signPathFoundation: false,
  foloRepository: false,
  certificateOffset,
  certificateSize,
  fileSize: fstatSync(fd).size,
}

if (certificateSize > 0) {
  const blob = read(certificateOffset, certificateSize).toString("latin1")
  result.signPathFoundation = /SignPath Foundation/.test(blob)
  result.foloRepository = /github\.com\/RSSNext\/Folo/i.test(blob)

  const names = new Set()
  for (const match of blob.matchAll(/[\x20-\x7E]{6,}/g)) {
    if (/SignPath|GlobalSign|DigiCert|Certum|Sectigo|SSL\.com|Microsoft/i.test(match[0])) {
      names.add(match[0].trim())
    }
  }
  result.names = [...names]
}

console.log(JSON.stringify(result, null, 2))
