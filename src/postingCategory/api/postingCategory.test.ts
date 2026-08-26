import { expect, test } from "bun:test"
import { lexwareJsonResponse, lexwareTestClient } from "../../shared/lexwareTestClient.test.js"
import { postingCategoryList } from "./postingCategoryList.js"

test("postingCategoryList retrieves and parses official posting categories", async () => {
  const response = [
    {
      id: "cf03a2b0-f838-474f-ac5e-67adb9b830c7",
      name: "Reise MA",
      type: "outgo",
      contactRequired: false,
      splitAllowed: true,
      groupName: "Reisen",
    },
  ]
  const { client, calls } = lexwareTestClient([lexwareJsonResponse(response)])

  const result = await postingCategoryList(client)

  expect(result.success).toBe(true)
  if (result.success) expect(result.data).toMatchObject(response)
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/posting-categories")
  expect(calls[0]?.init?.method).toBe("GET")
})

test("postingCategoryList rejects an invalid posting category", async () => {
  const { client } = lexwareTestClient([lexwareJsonResponse([{ type: "other" }])])

  const result = await postingCategoryList(client)

  expect(result.success).toBe(false)
})
