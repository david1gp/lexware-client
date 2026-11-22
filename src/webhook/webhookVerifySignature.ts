import { verify } from "node:crypto"
import { webhookPublicKey } from "./webhookPublicKey.js"

/** Verify the exact request bytes, without parsing or reserializing JSON. */
export function webhookVerifySignature(
  rawBody: string | Uint8Array,
  signatureBase64: string,
  publicKeyPem = webhookPublicKey,
): boolean {
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(signatureBase64) || !signatureBase64)
    return false
  try {
    return verify(
      "RSA-SHA512",
      typeof rawBody === "string" ? Buffer.from(rawBody, "utf8") : rawBody,
      publicKeyPem,
      Buffer.from(signatureBase64, "base64"),
    )
  } catch {
    return false
  }
}
