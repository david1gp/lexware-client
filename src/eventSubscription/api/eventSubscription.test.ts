import { expect, test } from "bun:test"
import { lexwareJsonResponse, lexwareRequestBodyJson, lexwareTestClient } from "../../shared/lexwareTestClient.test.js"
import { eventSubscriptionCreate } from "./eventSubscriptionCreate.js"
import { eventSubscriptionDelete } from "./eventSubscriptionDelete.js"
import { eventSubscriptionGet } from "./eventSubscriptionGet.js"
import { eventSubscriptionList } from "./eventSubscriptionList.js"

const subscription = {
  subscriptionId: "subscription-id",
  organizationId: "organization-id",
  createdDate: "2026-01-01T12:00:00.000+01:00",
  eventType: "contact.changed",
  callbackUrl: "https://example.org/webhook",
}

test("eventSubscriptionCreate posts the official request body", async () => {
  const { client, calls } = lexwareTestClient([
    lexwareJsonResponse(
      {
        id: "subscription-id",
        resourceUri: "https://api.lexware.io/v1/event-subscriptions/subscription-id",
        createdDate: "2026-01-01T12:00:00.000+01:00",
        updatedDate: "2026-01-01T12:00:00.000+01:00",
        version: 0,
      },
      { status: 201 },
    ),
  ])
  const result = await eventSubscriptionCreate(client, {
    eventType: "contact.changed",
    callbackUrl: "https://example.org/webhook",
  })
  expect(result.success).toBe(true)
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/event-subscriptions")
  expect(calls[0]?.init?.method).toBe("POST")
  expect(new Headers(calls[0]?.init?.headers).get("Content-Type")).toBe("application/json")
  expect(await lexwareRequestBodyJson(calls[0]!)).toEqual({
    eventType: "contact.changed",
    callbackUrl: "https://example.org/webhook",
  })
})

test("eventSubscriptionCreate rejects undocumented event types and non-HTTPS callbacks", async () => {
  const { client, calls } = lexwareTestClient()
  const result = await eventSubscriptionCreate(client, {
    eventType: "contact.updated",
    callbackUrl: "http://example.org/webhook",
  } as never)
  expect(result.success).toBe(false)
  if (!result.success) expect(result.op).toBe("eventSubscriptionCreate")
  expect(calls).toHaveLength(0)
})

test("eventSubscriptionGet encodes the subscription id and parses the response", async () => {
  const { client, calls } = lexwareTestClient([lexwareJsonResponse(subscription)])
  const result = await eventSubscriptionGet(client, "subscription/id")
  expect(result.success).toBe(true)
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/event-subscriptions/subscription%2Fid")
  expect(calls[0]?.init?.method).toBe("GET")
})

test("eventSubscriptionList retrieves the unpaged collection", async () => {
  const { client, calls } = lexwareTestClient([lexwareJsonResponse({ content: [subscription] })])
  const result = await eventSubscriptionList(client)
  expect(result.success).toBe(true)
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/event-subscriptions")
  expect(calls[0]?.init?.method).toBe("GET")
})

test("eventSubscriptionDelete sends DELETE and accepts the official 204 response", async () => {
  const { client, calls } = lexwareTestClient([new Response(null, { status: 204 })])
  const result = await eventSubscriptionDelete(client, "subscription/id")
  expect(result).toEqual({ success: true, data: null })
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/event-subscriptions/subscription%2Fid")
  expect(calls[0]?.init?.method).toBe("DELETE")
})
