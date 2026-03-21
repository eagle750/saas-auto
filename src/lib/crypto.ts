import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const hexKey = process.env.ENCRYPTION_KEY;
  if (!hexKey) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }
  return Buffer.from(hexKey, "hex");
}

/**
 * Encrypt plaintext using AES-256-GCM.
 * Returns a colon-separated string: iv:authTag:encryptedData (all hex-encoded).
 */
export function encrypt(text: string): string {
  const key = getKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypt an AES-256-GCM encrypted string produced by encrypt().
 */
export function decrypt(encryptedText: string): string {
  const key = getKey();
  const [ivHex, authTagHex, dataHex] = encryptedText.split(":");
  if (!ivHex || !authTagHex || !dataHex) {
    throw new Error("Invalid encrypted text format");
  }
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  return decipher.update(dataHex, "hex", "utf8") + decipher.final("utf8");
}
