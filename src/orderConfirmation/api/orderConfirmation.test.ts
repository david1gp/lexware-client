import { expect, test } from "bun:test"
import { lexwareTestClient } from "../../shared/lexwareTestClient.test.js"
import { orderConfirmationCreate } from "./orderConfirmationCreate.js"
import { orderConfirmationDelete } from "./orderConfirmationDelete.js"
import { orderConfirmationFileDownload } from "./orderConfirmationFileDownload.js"

test("orderConfirmationCreate posts order confirmation", async () => {
  const { client, calls } = lexwareTestClient()
  await orderConfirmationCreate(client, { title: "Order" })
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/order-confirmations")
  expect(calls[0]?.init?.method).toBe("POST")
})

test("orderConfirmationDelete deletes by id", async () => {
  const { client, calls } = lexwareTestClient()
  await orderConfirmationDelete(client, "o1")
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/order-confirmations/o1")
  expect(calls[0]?.init?.method).toBe("DELETE")
})

test("orderConfirmationFileDownload downloads order confirmation file", async () => {
  const { client, calls } = lexwareTestClient()
  const result = await orderConfirmationFileDownload(client, "order confirmation id")

  expect(result.success).toBe(true)
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/order-confirmations/order%20confirmation%20id/file")
})
