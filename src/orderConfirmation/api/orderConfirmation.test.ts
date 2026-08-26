import { expect, test } from "bun:test"
import { lexwareRequestBodyJson, lexwareTestClient } from "../../shared/lexwareTestClient.test.js"
import { orderConfirmationCreate } from "./orderConfirmationCreate.js"
import { orderConfirmationPdfDownload } from "./orderConfirmationPdfDownload.js"

test("orderConfirmationCreate posts order confirmation", async () => {
  const { client, calls } = lexwareTestClient()
  await orderConfirmationCreate(client, { orderConfirmation: { title: "Order" } })
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/order-confirmations")
  expect(calls[0]?.init?.method).toBe("POST")
})

test("orderConfirmationCreate sends finalize for a new order confirmation", async () => {
  const { client, calls } = lexwareTestClient()
  await orderConfirmationCreate(client, { finalize: true, orderConfirmation: { title: "Order" } })
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/order-confirmations?finalize=true")
})

test("orderConfirmationCreate sends the preceding sales voucher query", async () => {
  const { client, calls } = lexwareTestClient()
  await orderConfirmationCreate(client, {
    finalize: true,
    precedingSalesVoucherId: "invoice-id",
    orderConfirmation: { title: "Order" },
  })
  expect(String(calls[0]?.input)).toBe(
    "https://api.lexware.io/v1/order-confirmations?precedingSalesVoucherId=invoice-id",
  )
  expect(await lexwareRequestBodyJson(calls[0]!)).toEqual({ title: "Order" })
})

function binaryResponse(contentType: string): Response {
  return new Response(new Uint8Array([1, 2, 3]), { headers: { "Content-Type": contentType } })
}

test("orderConfirmationPdfDownload downloads a PDF order confirmation file", async () => {
  const { client, calls } = lexwareTestClient([binaryResponse("application/pdf")])
  const result = await orderConfirmationPdfDownload(client, "order confirmation/id")

  expect(result.success).toBe(true)
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/order-confirmations/order%20confirmation%2Fid/file")
  expect(new Headers(calls[0]?.init?.headers).get("Accept")).toBe("application/pdf")
  if (result.success) expect(result.data.contentType).toBe("application/pdf")
})
