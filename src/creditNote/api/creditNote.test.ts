import { expect, test } from "bun:test"
import { lexwareJsonResponse, lexwareRequestBodyJson, lexwareTestClient } from "../../shared/lexwareTestClient.test.js"
import type { CreditNoteCreateInput } from "../schema/creditNoteSchemas.js"
import { creditNoteCreate } from "./creditNoteCreate.js"
import { creditNoteGet } from "./creditNoteGet.js"
import { creditNotePdfDownload } from "./creditNotePdfDownload.js"
import { creditNoteXmlDownload } from "./creditNoteXmlDownload.js"

const validCreditNote: CreditNoteCreateInput["creditNote"] = {
  voucherDate: "2026-08-16T00:00:00.000Z",
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
}

test("creditNoteCreate sends finalize query and body", async () => {
  const { client, calls } = lexwareTestClient()
  await creditNoteCreate(client, {
    finalize: true,
    precedingSalesVoucherId: "invoice-id",
    creditNote: validCreditNote,
  })

  expect(String(calls[0]?.input)).toBe(
    "https://api.lexware.io/v1/credit-notes?precedingSalesVoucherId=invoice-id&finalize=true",
  )
  expect(calls[0]?.init?.method).toBe("POST")
  expect(await lexwareRequestBodyJson(calls[0]!)).toEqual(validCreditNote)
})

test("creditNoteGet retrieves an official credit note response", async () => {
  const response = {
    id: "credit-note-id",
    organizationId: "organization-id",
    createdDate: "2026-08-16T00:00:00.000+02:00",
    updatedDate: "2026-08-16T00:00:00.000+02:00",
    version: 1,
    language: "de",
    archived: false,
    voucherStatus: "draft",
    voucherNumber: null,
    voucherDate: "2026-08-16T00:00:00.000+02:00",
    address: { name: "Example customer", countryCode: "DE" },
    electronicDocumentProfile: "NONE",
    lineItems: [
      {
        type: "custom",
        name: "Consulting",
        quantity: 1,
        unitName: "Hours",
        unitPrice: { currency: "EUR", netAmount: 100, taxRatePercentage: 19 },
        lineItemAmount: 100,
      },
    ],
    totalPrice: { currency: "EUR", totalNetAmount: 100 },
    taxAmounts: [{ taxRatePercentage: 19, taxAmount: 19, netAmount: 100 }],
    taxConditions: { taxType: "net" },
    relatedVouchers: [],
    printLayoutId: null,
    title: null,
    introduction: null,
    remark: null,
  } as const
  const { client, calls } = lexwareTestClient([lexwareJsonResponse(response)])
  const result = await creditNoteGet(client, "credit note/id")

  expect(result.success).toBe(true)
  if (result.success) expect(result.data).toMatchObject(response)
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/credit-notes/credit%20note%2Fid")
  expect(calls[0]?.init?.method).toBe("GET")
})

function binaryResponse(contentType: string): Response {
  return new Response(new Uint8Array([1, 2, 3]), { headers: { "Content-Type": contentType } })
}

test("creditNotePdfDownload downloads a PDF credit note file", async () => {
  const { client, calls } = lexwareTestClient([binaryResponse("application/pdf")])
  const result = await creditNotePdfDownload(client, "credit note/id")

  expect(result.success).toBe(true)
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/credit-notes/credit%20note%2Fid/file")
  expect(new Headers(calls[0]?.init?.headers).get("Accept")).toBe("application/pdf")
  if (result.success) expect(result.data.contentType).toBe("application/pdf")
})

test("creditNoteXmlDownload downloads an XML credit note file", async () => {
  const { client, calls } = lexwareTestClient([binaryResponse("application/xml")])
  const result = await creditNoteXmlDownload(client, "credit note/id")

  expect(result.success).toBe(true)
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/credit-notes/credit%20note%2Fid/file")
  expect(new Headers(calls[0]?.init?.headers).get("Accept")).toBe("application/xml")
  if (result.success) expect(result.data.contentType).toBe("application/xml")
})
