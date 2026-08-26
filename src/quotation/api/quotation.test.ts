import { expect, test } from "bun:test"
import { lexwareRequestBodyJson, lexwareTestClient } from "../../shared/lexwareTestClient.test.js"
import { quotationCreate } from "./quotationCreate.js"
import { quotationDelete } from "./quotationDelete.js"
import { quotationFileDownload } from "./quotationFileDownload.js"
import { quotationList } from "./quotationList.js"
import { quotationUpdate } from "./quotationUpdate.js"

test("quotationList builds page query", async () => {
  const { client, calls } = lexwareTestClient()
  await quotationList(client, { page: 3 })
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/quotations?page=3")
})

test("quotationDelete deletes quotation", async () => {
  const { client, calls } = lexwareTestClient()
  await quotationDelete(client, "q1")
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/quotations/q1")
  expect(calls[0]?.init?.method).toBe("DELETE")
})

test("quotationFileDownload downloads quotation file", async () => {
  const { client, calls } = lexwareTestClient()
  const result = await quotationFileDownload(client, "q1")

  expect(result.success).toBe(true)
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/quotations/q1/file")
})

test("quotationCreate rejects invalid line items", async () => {
  const { client } = lexwareTestClient()
  const result = await quotationCreate(client, {
    lineItems: [{ type: "wrong" }],
  } as never)
  expect(result.success).toBe(false)
})

test("quotationUpdate preserves partial update bodies", async () => {
  const { client, calls } = lexwareTestClient()
  const result = await quotationUpdate(client, "q1", { title: "Updated quotation" })

  expect(result.success).toBe(true)
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/quotations/q1")
  expect(calls[0]?.init?.method).toBe("PUT")
  expect(await lexwareRequestBodyJson(calls[0]!)).toEqual({ title: "Updated quotation" })
})
