import { expect, test } from "bun:test"
import { lexwareRequestBodyJson, lexwareTestClient } from "../../shared/lexwareTestClient.test.js"
import type { CreditNoteCreateInput } from "../schema/creditNoteSchemas.js"
import { creditNoteCreate } from "./creditNoteCreate.js"
import { creditNotePdfDownload } from "./creditNotePdfDownload.js"
import { creditNoteXmlDownload } from "./creditNoteXmlDownload.js"

const validCreditNote: CreditNoteCreateInput["creditNote"] = {
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
