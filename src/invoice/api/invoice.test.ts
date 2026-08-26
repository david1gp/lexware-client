import { expect, test } from "bun:test"
import { lexwareRequestBodyJson, lexwareTestClient } from "../../shared/lexwareTestClient.test.js"
import type { InvoiceCreateInput } from "../schema/invoiceSchemas.js"
import { invoiceCreate } from "./invoiceCreate.js"
import { invoiceFileDownload } from "./invoiceFileDownload.js"
import { invoiceUpdate } from "./invoiceUpdate.js"

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

test("invoiceFileDownload downloads invoice file", async () => {
  const { client, calls } = lexwareTestClient()
  const result = await invoiceFileDownload(client, "invoice id")

  expect(result.success).toBe(true)
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/invoices/invoice%20id/file")
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
