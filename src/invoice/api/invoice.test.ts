import { expect, test } from "bun:test"
import { lexwareRequestBodyJson, lexwareTestClient } from "../../shared/lexwareTestClient.test.js"
import type { InvoiceCreateInput } from "../schema/invoiceSchemas.js"
import { invoiceCreate } from "./invoiceCreate.js"
import { invoicePdfDownload } from "./invoicePdfDownload.js"
import { invoiceUpdate } from "./invoiceUpdate.js"
import { invoiceXmlDownload } from "./invoiceXmlDownload.js"

const validInvoice: InvoiceCreateInput["invoice"] = {
  voucherDate: "2026-08-16T00:00",
  address: { name: "Example customer", countryCode: "DE" },
  lineItems: [
    {
      type: "custom",
      name: "Consulting",
      quantity: 1,
      unitName: "Hours",
      unitPrice: { currency: "EUR", netAmount: 100, taxRatePercentage: 19 },
    },
  ],
  totalPrice: { currency: "EUR", totalNetAmount: 100 },
  taxConditions: { taxType: "net" },
  shippingConditions: { shippingType: "none" },
}

test("invoiceCreate sends finalize query", async () => {
  const { client, calls } = lexwareTestClient()
  await invoiceCreate(client, {
    finalize: true,
    invoice: validInvoice,
  })
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/invoices?finalize=true")
  expect(await lexwareRequestBodyJson(calls[0]!)).toEqual(validInvoice)
})

function binaryResponse(contentType: string): Response {
  return new Response(new Uint8Array([1, 2, 3]), { headers: { "Content-Type": contentType } })
}

test("invoicePdfDownload downloads a PDF invoice file", async () => {
  const { client, calls } = lexwareTestClient([binaryResponse("application/pdf")])
  const result = await invoicePdfDownload(client, "invoice id")

  expect(result.success).toBe(true)
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/invoices/invoice%20id/file")
  expect(new Headers(calls[0]?.init?.headers).get("Accept")).toBe("application/pdf")
  if (result.success) expect(result.data.contentType).toBe("application/pdf")
})

test("invoiceXmlDownload downloads an XML invoice file", async () => {
  const { client, calls } = lexwareTestClient([binaryResponse("application/xml")])
  const result = await invoiceXmlDownload(client, "invoice/id")

  expect(result.success).toBe(true)
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/invoices/invoice%2Fid/file")
  expect(new Headers(calls[0]?.init?.headers).get("Accept")).toBe("application/xml")
  if (result.success) expect(result.data.contentType).toBe("application/xml")
})

test("invoiceUpdate uses singular invoice path", async () => {
  const { client, calls } = lexwareTestClient()
  await invoiceUpdate(client, "i1", validInvoice)
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/invoice/i1")
  expect(calls[0]?.init?.method).toBe("PUT")
})

test("invoiceUpdate preserves partial update requests", async () => {
  const { client, calls } = lexwareTestClient()
  const result = await invoiceUpdate(client, "i1", {
    title: "Updated title",
    lineItems: [{ name: "item" }],
  })

  expect(result.success).toBe(true)
  expect(await lexwareRequestBodyJson(calls[0]!)).toEqual({
    title: "Updated title",
    lineItems: [{ name: "item" }],
  })
})
