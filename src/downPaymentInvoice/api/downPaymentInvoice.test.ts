import { expect, test } from "bun:test"
import { lexwareTestClient } from "../../shared/lexwareTestClient.test.js"
import { downPaymentInvoicePdfDownload } from "./downPaymentInvoicePdfDownload.js"
import { downPaymentInvoiceXmlDownload } from "./downPaymentInvoiceXmlDownload.js"

function binaryResponse(contentType: string): Response {
  return new Response(new Uint8Array([1, 2, 3]), { headers: { "Content-Type": contentType } })
}

test("downPaymentInvoicePdfDownload downloads a PDF down-payment invoice file", async () => {
  const { client, calls } = lexwareTestClient([binaryResponse("application/pdf")])
  const result = await downPaymentInvoicePdfDownload(client, "down-payment invoice/id")

  expect(result.success).toBe(true)
  expect(String(calls[0]?.input)).toBe(
    "https://api.lexware.io/v1/down-payment-invoices/down-payment%20invoice%2Fid/file",
  )
  expect(new Headers(calls[0]?.init?.headers).get("Accept")).toBe("application/pdf")
  if (result.success) expect(result.data.contentType).toBe("application/pdf")
})

test("downPaymentInvoiceXmlDownload downloads an XML down-payment invoice file", async () => {
  const { client, calls } = lexwareTestClient([binaryResponse("application/xml")])
  const result = await downPaymentInvoiceXmlDownload(client, "down-payment invoice/id")

  expect(result.success).toBe(true)
  expect(String(calls[0]?.input)).toBe(
    "https://api.lexware.io/v1/down-payment-invoices/down-payment%20invoice%2Fid/file",
  )
  expect(new Headers(calls[0]?.init?.headers).get("Accept")).toBe("application/xml")
  if (result.success) expect(result.data.contentType).toBe("application/xml")
})
