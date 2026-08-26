import { expect, test } from "bun:test"
import { lexwareJsonResponse, lexwareTestClient } from "../../shared/lexwareTestClient.test.js"
import { downPaymentInvoiceGet } from "./downPaymentInvoiceGet.js"
import { downPaymentInvoicePdfDownload } from "./downPaymentInvoicePdfDownload.js"
import { downPaymentInvoiceXmlDownload } from "./downPaymentInvoiceXmlDownload.js"

const response = {
  id: "down-payment-invoice-id",
  organizationId: "organization-id",
  createdDate: "2026-08-16T10:00:00.000+02:00",
  updatedDate: "2026-08-16T10:00:00.000+02:00",
  version: 3,
  language: "de",
  archived: false,
  voucherStatus: "open",
  voucherNumber: "RE1129",
  voucherDate: "2026-08-16T10:00:00.000+02:00",
  dueDate: "2026-09-15T00:00:00.000+02:00",
  address: { name: "Example customer", countryCode: "DE" },
  electronicDocumentProfile: "NONE",
  lineItems: [
    {
      type: "custom",
      name: "Pauschaler Abschlag",
      quantity: 1,
      unitPrice: { currency: "EUR", netAmount: 100, grossAmount: 119, taxRatePercentage: 19 },
      lineItemAmount: 119,
    },
  ],
  totalPrice: { currency: "EUR", totalNetAmount: 100, totalGrossAmount: 119, totalTaxAmount: 19 },
  taxAmounts: [{ taxRatePercentage: 19, taxAmount: 19, netAmount: 100 }],
  taxConditions: { taxType: "gross" },
  paymentConditions: {
    paymentTermLabel: "30 Tage netto",
    paymentTermLabelTemplate: "{paymentRange} Tage netto",
    paymentTermDuration: 30,
  },
  shippingConditions: { shippingType: "none" },
  closingInvoiceId: null,
  relatedVouchers: [],
  printLayoutId: null,
  title: "1. Abschlagsrechnung",
  introduction: null,
  remark: "Vielen Dank.",
} as const

test("downPaymentInvoiceGet retrieves and validates an official response", async () => {
  const { client, calls } = lexwareTestClient([lexwareJsonResponse(response)])
  const result = await downPaymentInvoiceGet(client, "down-payment invoice/id")

  expect(result.success).toBe(true)
  if (result.success) expect(result.data).toMatchObject(response)
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/down-payment-invoices/down-payment%20invoice%2Fid")
  expect(calls[0]?.init?.method).toBe("GET")
})

test("downPaymentInvoiceGet rejects a response with an unofficial status", async () => {
  const { client } = lexwareTestClient([lexwareJsonResponse({ ...response, voucherStatus: "paidoff" })])
  const result = await downPaymentInvoiceGet(client, "down-payment-invoice-id")

  expect(result.success).toBe(false)
})

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
