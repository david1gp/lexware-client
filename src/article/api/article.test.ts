import { expect, test } from "bun:test"
import { lexwareRequestBodyJson, lexwareTestClient } from "../../shared/lexwareTestClient.test.js"
import { articleCreate } from "./articleCreate.js"
import { articleList } from "./articleList.js"

test("articleList builds list query", async () => {
  const { client, calls } = lexwareTestClient()
  const result = await articleList(client, {
    page: 0,
    articleNumber: "A&B 1",
    gtin: "123/456",
    type: "PRODUCT",
  })
  expect(result.success).toBe(true)
  expect(String(calls[0]?.input)).toBe(
    "https://api.lexware.io/v1/articles?page=0&articleNumber=A%26B+1&gtin=123%2F456&type=PRODUCT",
  )
  expect(calls[0]?.init?.method).toBe("GET")
  expect(new Headers(calls[0]?.init?.headers).get("Authorization")).toBe("Bearer token")
})

test("articleList validates paging and filter values", async () => {
  const { client, calls } = lexwareTestClient()
  const invalidPage = await articleList(client, { page: -1 })
  const invalidType = await articleList(client, { type: "INVALID" } as never)

  expect(invalidPage.success).toBe(false)
  expect(invalidType.success).toBe(false)
  expect(calls).toHaveLength(0)
})

test("articleCreate validates input and defaults version", async () => {
  const { client, calls } = lexwareTestClient()
  const result = await articleCreate(client, {
    type: "SERVICE",
    title: "Consulting",
  })
  expect(result.success).toBe(true)
  expect(await lexwareRequestBodyJson(calls[0]!)).toEqual({
    type: "SERVICE",
    title: "Consulting",
    version: 0,
  })

  const invalid = await articleCreate(client, { type: "INVALID" } as never)
  expect(invalid.success).toBe(false)
  if (!invalid.success) expect(invalid.op).toBe("articleCreate")
})
