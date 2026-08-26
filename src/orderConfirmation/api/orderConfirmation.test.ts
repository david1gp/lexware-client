import { expect, test } from "bun:test"
import { lexwareTestClient } from "../../shared/lexwareTestClient.test.js"
import { orderConfirmationCreate } from "./orderConfirmationCreate.js"
import { orderConfirmationDelete } from "./orderConfirmationDelete.js"
import { orderConfirmationPdfDownload } from "./orderConfirmationPdfDownload.js"

test("orderConfirmationCreate posts order confirmation", async () => {
  const { client, calls } = lexwareTestClient()
  await orderConfirmationCreate(client, { title: "Order" })
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/order-confirmations")
  expect(calls[0]?.init?.method).toBe("POST")
})

test("orderConfirmationDelete deletes by id", async () => {
  const { client, calls } = lexwareTestClient()
  await orderConfirmationDelete(client, "o1")
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/order-confirmations/o1")
  expect(calls[0]?.init?.method).toBe("DELETE")
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
