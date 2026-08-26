import { expect, test } from "bun:test"
import { lexwareRequestBinary } from "../../shared/lexwareRequest.js"
import { lexwareTestClient } from "../../shared/lexwareTestClient.test.js"
import { fileDownload } from "./fileDownload.js"
import { fileUpload } from "./fileUpload.js"

test("fileUpload posts multipart without json content type", async () => {
  const { client, calls } = lexwareTestClient()
  await fileUpload(client, {
    type: "voucher",
    filename: "invoice.pdf",
    data: new Blob(["pdf"]),
  })
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/files")
  expect(calls[0]?.init?.method).toBe("POST")
  expect(calls[0]?.init?.body).toBeInstanceOf(FormData)
  expect(new Headers(calls[0]?.init?.headers).get("Content-Type")).toBe(null)
})

test("fileDownload returns filename from content disposition", async () => {
  const response = new Response(new Uint8Array([1, 2, 3]), {
    headers: {
      "Content-Disposition": "attachment; filename*=UTF-8''rechnung.pdf",
      "Content-Type": "application/pdf",
    },
  })
  const { client } = lexwareTestClient([response])
  const result = await fileDownload(client, "f1")
  expect(result.success).toBe(true)
  if (result.success) expect(result.data.filename).toBe("rechnung.pdf")
})

test("lexwareRequestBinary uses wildcard accept by default", async () => {
  const { client, calls } = lexwareTestClient()
  await lexwareRequestBinary(client, { binary: true, path: "/v1/files/f1" })
  expect(new Headers(calls[0]?.init?.headers).get("Accept")).toBe("*/*")
})

test("lexwareRequestBinary preserves explicit accept override", async () => {
  const { client, calls } = lexwareTestClient()
  await lexwareRequestBinary(client, {
    binary: true,
    path: "/v1/files/f1",
    headers: { Accept: "application/pdf" },
  })
  expect(new Headers(calls[0]?.init?.headers).get("Accept")).toBe("application/pdf")
})
