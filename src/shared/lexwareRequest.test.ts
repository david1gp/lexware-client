import { expect, test } from "bun:test"
import { lexwareRequestPdf, lexwareRequestXml } from "./lexwareRequest.js"
import { lexwareTestClient } from "./lexwareTestClient.test.js"

function binaryResponse(contentType?: string): Response {
  return new Response(new Uint8Array([1, 2, 3]), {
    headers: contentType === undefined ? {} : { "Content-Type": contentType },
  })
}

test("lexwareRequestPdf returns a concrete PDF response", async () => {
  const { client } = lexwareTestClient([binaryResponse("application/pdf")])
  const result = await lexwareRequestPdf(client, { binary: true, path: "/v1/invoices/i1/file" })

  expect(result.success).toBe(true)
  if (result.success) expect(result.data.contentType).toBe("application/pdf")
})

test("lexwareRequestXml returns a concrete XML response", async () => {
  const { client } = lexwareTestClient([binaryResponse("application/xml")])
  const result = await lexwareRequestXml(client, { binary: true, path: "/v1/invoices/i1/file" })

  expect(result.success).toBe(true)
  if (result.success) expect(result.data.contentType).toBe("application/xml")
})

test("typed request helpers normalize response media types", async () => {
  const { client } = lexwareTestClient([binaryResponse(" Application/PDF ; charset=utf-8")])
  const result = await lexwareRequestPdf(client, { binary: true, path: "/v1/invoices/i1/file" })

  expect(result.success).toBe(true)
})

test("typed request helpers reject missing and mismatched media types", async () => {
  const missing = lexwareTestClient([binaryResponse()])
  const missingResult = await lexwareRequestPdf(missing.client, { binary: true, path: "/v1/invoices/i1/file" })
  expect(missingResult.success).toBe(false)
  if (!missingResult.success) {
    expect(missingResult.op).toBe("lexwareRequestPdf")
    expect(missingResult.errorMessage).toContain("missing")
  }

  const mismatched = lexwareTestClient([binaryResponse("application/xml")])
  const mismatchedResult = await lexwareRequestPdf(mismatched.client, {
    binary: true,
    path: "/v1/invoices/i1/file",
  })
  expect(mismatchedResult.success).toBe(false)
  if (!mismatchedResult.success) expect(mismatchedResult.errorMessage).toContain("application/xml")
})

test("typed request helpers send their explicit accept headers", async () => {
  const pdf = lexwareTestClient([binaryResponse("application/pdf")])
  await lexwareRequestPdf(pdf.client, { binary: true, path: "/v1/invoices/i1/file", headers: { Accept: "*/*" } })
  expect(new Headers(pdf.calls[0]?.init?.headers).get("Accept")).toBe("application/pdf")

  const xml = lexwareTestClient([binaryResponse("application/xml")])
  await lexwareRequestXml(xml.client, { binary: true, path: "/v1/invoices/i1/file" })
  expect(new Headers(xml.calls[0]?.init?.headers).get("Accept")).toBe("application/xml")
})
