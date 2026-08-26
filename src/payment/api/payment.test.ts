import { expect, test } from "bun:test"
import { lexwareJsonResponse, lexwareTestClient } from "../../shared/lexwareTestClient.test.js"
import { paymentGet } from "./paymentGet.js"

test("paymentGet retrieves and parses official payment information", async () => {
  const response = {
    openAmount: 1337,
    currency: "EUR",
    paymentStatus: "openRevenue",
    voucherType: "salesinvoice",
    voucherStatus: "open",
    paymentItems: [
      {
        paymentItemType: "manualPayment",
        postingDate: "2023-11-04T00:00:00.000+01:00",
        amount: 10,
        currency: "EUR",
      },
    ],
  }
  const { client, calls } = lexwareTestClient([lexwareJsonResponse(response)])

  const result = await paymentGet(client, "voucher/id")

  expect(result.success).toBe(true)
  if (result.success) expect(result.data).toMatchObject(response)
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/payments/voucher%2Fid")
  expect(calls[0]?.init?.method).toBe("GET")
})

test("paymentGet rejects an invalid payment response", async () => {
  const { client, calls } = lexwareTestClient([lexwareJsonResponse({ paymentStatus: "unknown" })])

  const result = await paymentGet(client, "voucher-id")

  expect(result.success).toBe(false)
  expect(calls).toHaveLength(1)
})
