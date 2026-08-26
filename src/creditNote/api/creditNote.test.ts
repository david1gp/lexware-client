import { expect, test } from "bun:test"
import { lexwareTestClient } from "../../shared/lexwareTestClient.test.js"
import { creditNoteFileDownload } from "./creditNoteFileDownload.js"

test("creditNoteFileDownload downloads credit note file", async () => {
  const { client, calls } = lexwareTestClient()
  const result = await creditNoteFileDownload(client, "credit note id")

  expect(result.success).toBe(true)
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/credit-notes/credit%20note%20id/file")
})
