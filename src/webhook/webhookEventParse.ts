import { createResult, createResultErrorCode, type Result } from "#result"
import * as a from "valibot"
import { type WebhookEvent, webhookEventSchema } from "./webhookEventSchema.js"
import { webhookVerifySignature } from "./webhookVerifySignature.js"

export function webhookEventParse(
  rawBody: string | Uint8Array,
  signatureHeader: string | null | undefined,
  options?: { publicKeyPem?: string },
): Result<WebhookEvent> {
  const op = "webhookEventParse"
  if (!signatureHeader) return createResultErrorCode(op, "Missing signature", "webhook.missing-signature")
  if (!webhookVerifySignature(rawBody, signatureHeader, options?.publicKeyPem)) {
    return createResultErrorCode(op, "Invalid signature", "webhook.invalid-signature")
  }
  let payload: unknown
  try {
    payload = JSON.parse(
      typeof rawBody === "string" ? rawBody : new TextDecoder("utf-8", { fatal: true }).decode(rawBody),
    )
  } catch {
    return createResultErrorCode(op, "Invalid payload", "webhook.invalid-payload")
  }
  const parsed = a.safeParse(webhookEventSchema, payload)
  if (!parsed.success) return createResultErrorCode(op, "Invalid payload", "webhook.invalid-payload")
  return createResult(parsed.output)
}
