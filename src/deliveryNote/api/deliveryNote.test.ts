import { expect, test } from "bun:test"
import { lexwareTestClient } from "../../shared/lexwareTestClient.test.js"
import { deliveryNotePdfDownload } from "./deliveryNotePdfDownload.js"

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
