import { expect, test } from "bun:test"
import { lexwareTestClient } from "../../shared/lexwareTestClient.test.js"
import { quotationCreate } from "./quotationCreate.js"
import { quotationPdfDownload } from "./quotationPdfDownload.js"

function binaryResponse(contentType: string): Response {
  return new Response(new Uint8Array([1, 2, 3]), { headers: { "Content-Type": contentType } })
}

test("quotationPdfDownload downloads a PDF quotation file", async () => {
  const { client, calls } = lexwareTestClient([binaryResponse("application/pdf")])
  const result = await quotationPdfDownload(client, "quotation id")

  expect(result.success).toBe(true)
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/quotations/quotation%20id/file")
  expect(new Headers(calls[0]?.init?.headers).get("Accept")).toBe("application/pdf")
  if (result.success) expect(result.data.contentType).toBe("application/pdf")
})

test("quotationCreate rejects invalid line items", async () => {
  const { client } = lexwareTestClient()
  const result = await quotationCreate(client, {
    lineItems: [{ type: "wrong" }],
  } as never)
  expect(result.success).toBe(false)
})
