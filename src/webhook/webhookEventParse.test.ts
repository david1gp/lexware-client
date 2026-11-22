import { describe, expect, test } from "bun:test"
import { generateKeyPairSync, sign } from "node:crypto"
import { webhookEventParse } from "./webhookEventParse.js"
import { webhookVerifySignature } from "./webhookVerifySignature.js"

const keys = generateKeyPairSync("rsa", { modulusLength: 2048 })
const publicKeyPem = keys.publicKey.export({ type: "spki", format: "pem" })
const event = {
  organizationId: "org",
  eventType: "contact.changed" as const,
  resourceId: "contact",
  eventDate: "2018-07-03T17:11:21.348+02:00",
}
const body = JSON.stringify(event)
const signature = (raw: string | Uint8Array) => sign("RSA-SHA512", Buffer.from(raw), keys.privateKey).toString("base64")
const parse = (raw: string, sig: string | null = signature(raw)) => webhookEventParse(raw, sig, { publicKeyPem })

describe("webhook verification and parsing", () => {
  test("accepts a valid signed payload and exact bytes", () => {
    const bytes = Buffer.from(body)
    expect(webhookVerifySignature(bytes, signature(bytes), publicKeyPem)).toBe(true)
    expect(webhookEventParse(bytes, signature(bytes), { publicKeyPem })).toEqual({ success: true, data: event })
  })
  test("rejects tampering, invalid signature and invalid key", () => {
    expect(webhookVerifySignature(`${body} `, signature(body), publicKeyPem)).toBe(false)
    expect(webhookVerifySignature(body, "not-base64!", publicKeyPem)).toBe(false)
    expect(webhookVerifySignature(body, signature(body), "invalid key")).toBe(false)
    expect(parse(`${body} `, signature(body))).toMatchObject({ success: false, code: "webhook.invalid-signature" })
  })
  test("reports missing signature separately", () => {
    expect(parse(body, null)).toMatchObject({ success: false, code: "webhook.missing-signature" })
  })
  test("rejects signed invalid JSON and schema-invalid payloads", () => {
    expect(parse("{")).toMatchObject({ success: false, code: "webhook.invalid-payload" })
    expect(parse(JSON.stringify({ ...event, eventType: "invalid" }))).toMatchObject({
      success: false,
      code: "webhook.invalid-payload",
    })
    expect(parse(JSON.stringify({ ...event, eventDate: "not a date" }))).toMatchObject({
      success: false,
      code: "webhook.invalid-payload",
    })
  })
})
