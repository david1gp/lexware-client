import { expect, test } from "bun:test"
import { lexwareJsonResponse, lexwareRequestBodyJson, lexwareTestClient } from "../../shared/lexwareTestClient.test.js"
import { dunningCreate } from "./dunningCreate.js"
import { dunningPdfDownload } from "./dunningPdfDownload.js"

test("dunningCreate fetches invoice then posts dunning", async () => {
  const { client, calls } = lexwareTestClient([
    lexwareJsonResponse({
      address: { contactId: "c1" },
      lineItems: [{ name: "base" }],
      taxConditions: { taxType: "net" },
    }),
    lexwareJsonResponse({ id: "d1" }),
  ])
  const result = await dunningCreate(client, {
    precedingSalesVoucherId: "i1",
    finalize: true,
    extraLineItems: [{ name: "fee" }],
  })
  expect(result.success).toBe(true)
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/invoices/i1")
  expect(String(calls[1]?.input)).toBe("https://api.lexware.io/v1/dunnings?precedingSalesVoucherId=i1&finalize=true")
  expect(await lexwareRequestBodyJson(calls[1]!)).toMatchObject({
    lineItems: [{ name: "base" }, { name: "fee" }],
  })
})

function binaryResponse(contentType: string): Response {
  return new Response(new Uint8Array([1, 2, 3]), { headers: { "Content-Type": contentType } })
}

test("dunningPdfDownload downloads a PDF dunning file", async () => {
  const { client, calls } = lexwareTestClient([binaryResponse("application/pdf")])
  const result = await dunningPdfDownload(client, "dunning/id")

  expect(result.success).toBe(true)
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/dunnings/dunning%2Fid/file")
  expect(new Headers(calls[0]?.init?.headers).get("Accept")).toBe("application/pdf")
  if (result.success) expect(result.data.contentType).toBe("application/pdf")
})
