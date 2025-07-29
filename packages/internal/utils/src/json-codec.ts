export class JsonObfuscatedCodec {
  // Custom charset for converting bytes to printable characters
  private static charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
  private static charsetLength = JsonObfuscatedCodec.charset.length

  // Generate a key
  private static key = "Folo"

  // Convert string to byte array
  private static toBytes(str: string): Uint8Array {
    const encoder = new TextEncoder()
    return encoder.encode(str)
  }

  // Convert byte array to string
  private static fromBytes(bytes: Uint8Array): string {
    const decoder = new TextDecoder()
    return decoder.decode(bytes)
  }

  // XOR encrypt/decrypt byte array
  private static xorBytes(input: Uint8Array, key: string): Uint8Array {
    const keyBytes = this.toBytes(key)
    const output = new Uint8Array(input.length)
    for (const [i, element] of input.entries()) {
      const keyByte = keyBytes[i % keyBytes.length]
      if (keyByte !== undefined) {
        output[i] = element ^ keyByte
      }
    }
    return output
  }

  // Convert byte array to custom charset string
  private static bytesToCharset(bytes: Uint8Array): string {
    let result = ""
    for (const byte of bytes) {
      // Map each byte to two characters (add confusion effect)
      const high = Math.floor(byte / this.charsetLength)
      const low = byte % this.charsetLength
      const highChar = this.charset[high]
      const lowChar = this.charset[low]
      if (highChar !== undefined && lowChar !== undefined) {
        result += highChar + lowChar
      }
    }
    return result
  }

  // Convert custom charset string to byte array
  private static charsetToBytes(str: string): Uint8Array {
    const bytes = new Uint8Array(str.length / 2)
    for (let i = 0; i < str.length; i += 2) {
      const highChar = str[i]
      const lowChar = str[i + 1]
      if (highChar === undefined || lowChar === undefined) {
        throw new Error("Invalid encoded string: incomplete character pair")
      }
      const high = this.charset.indexOf(highChar)
      const low = this.charset.indexOf(lowChar)
      if (high === -1 || low === -1) {
        throw new Error("Invalid encoded string")
      }
      bytes[i / 2] = high * this.charsetLength + low
    }
    return bytes
  }

  // Encode JSON object to obfuscated string
  static encode(obj: any, key: string = this.key): string {
    try {
      // Convert JSON object to string (support Chinese)
      const jsonStr = JSON.stringify(obj)
      // Convert to byte array
      const bytes = this.toBytes(jsonStr)
      // Use XOR encryption
      const encrypted = this.xorBytes(bytes, key)
      // Convert to custom charset string
      return this.bytesToCharset(encrypted)
    } catch (error) {
      console.error("Encoding error:", error)
      throw new Error("Failed to encode JSON")
    }
  }

  // Decode obfuscated string to JSON object
  static decode(encodedStr: string, key: string = this.key): any {
    try {
      // Convert from custom charset string to byte array
      const bytes = this.charsetToBytes(encodedStr)
      // Use XOR decryption
      const decrypted = this.xorBytes(bytes, key)
      // Convert to JSON string
      const jsonStr = this.fromBytes(decrypted)
      // Parse JSON
      return JSON.parse(jsonStr)
    } catch (error) {
      console.error("Decoding error:", error)
      throw new Error("Failed to decode JSON")
    }
  }
}
