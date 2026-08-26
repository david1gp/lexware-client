import { expect, test } from "bun:test"
import { lexwareJsonResponse, lexwareRequestBodyJson, lexwareTestClient } from "../../shared/lexwareTestClient.test.js"
import type { DeliveryNoteCreateInput } from "../schema/deliveryNoteSchemas.js"
import { deliveryNoteCreate } from "./deliveryNoteCreate.js"
import { deliveryNoteGet } from "./deliveryNoteGet.js"
import { deliveryNotePdfDownload } from "./deliveryNotePdfDownload.js"

const validDeliveryNote: DeliveryNoteCreateInput["deliveryNote"] = {
  voucherDate: "2026-08-16T00:00:00.000+02:00",
  address: { name: "Example customer", countryCode: "DE" },
  lineItems: [
    {
      type: "custom",
      name: "Consulting",
      quantity: 1,
      unitName: "Hours",
    },
  ],
  taxConditions: { taxType: "net" },
  shippingConditions: { shippingType: "none" },
}

const createResponse = {
  id: "delivery-note-id",
  resourceUri: "https://api.lexware.io/v1/delivery-notes/delivery-note-id",
  createdDate: "2026-08-16T00:00:00.000+02:00",
  updatedDate: "2026-08-16T00:00:00.000+02:00",
  version: 1,
} as const

test("deliveryNoteCreate creates a draft delivery note", async () => {
  const { client, calls } = lexwareTestClient([lexwareJsonResponse(createResponse)])
  const result = await deliveryNoteCreate(client, { deliveryNote: validDeliveryNote })

  expect(result.success).toBe(true)
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/delivery-notes")
  expect(calls[0]?.init?.method).toBe("POST")
  expect(await lexwareRequestBodyJson(calls[0]!)).toEqual(validDeliveryNote)
})

test("deliveryNoteCreate sends finalize for a new delivery note", async () => {
  const { client, calls } = lexwareTestClient([lexwareJsonResponse(createResponse)])
  await deliveryNoteCreate(client, { deliveryNote: validDeliveryNote, finalize: true })

  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/delivery-notes?finalize=true")
})

test("deliveryNoteCreate pursues a preceding sales voucher without finalize", async () => {
  const { client, calls } = lexwareTestClient([lexwareJsonResponse(createResponse)])
  await deliveryNoteCreate(client, {
    deliveryNote: validDeliveryNote,
    precedingSalesVoucherId: "invoice-id",
    finalize: true,
  })

  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/delivery-notes?precedingSalesVoucherId=invoice-id")
})

test("deliveryNoteGet retrieves an official delivery note response", async () => {
  const response = {
    id: "delivery-note-id",
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
    lineItems: [{ type: "custom", name: "Consulting", quantity: 1, unitName: "Hours", unitPrice: null }],
    taxConditions: { taxType: "net" },
    relatedVouchers: [],
  } as const
  const { client, calls } = lexwareTestClient([lexwareJsonResponse(response)])
  const result = await deliveryNoteGet(client, "delivery note/id")

  expect(result.success).toBe(true)
  if (result.success) expect(result.data).toMatchObject(response)
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/delivery-notes/delivery%20note%2Fid")
  expect(calls[0]?.init?.method).toBe("GET")
})

function binaryResponse(contentType: string): Response {
  return new Response(new Uint8Array([1, 2, 3]), { headers: { "Content-Type": contentType } })
}

test("deliveryNotePdfDownload downloads a PDF delivery note file", async () => {
  const { client, calls } = lexwareTestClient([binaryResponse("application/pdf")])
  const result = await deliveryNotePdfDownload(client, "delivery note/id")

  expect(result.success).toBe(true)
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/delivery-notes/delivery%20note%2Fid/file")
  expect(new Headers(calls[0]?.init?.headers).get("Accept")).toBe("application/pdf")
  if (result.success) expect(result.data.contentType).toBe("application/pdf")
})
