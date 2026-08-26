import { expect, test } from "bun:test"
import { lexwareJsonResponse, lexwareTestClient } from "../../shared/lexwareTestClient.test.js"
import { paymentConditionList } from "./paymentConditionList.js"

test("paymentConditionList retrieves and parses official payment conditions", async () => {
  const response = [
    {
      id: "65be0654-60b6-11eb-b66d-5731dbc9bf6b",
      paymentTermLabelTemplate: "Zahlbar in {paymentRange} Tagen, rein netto ohne Abzug",
      paymentTermDuration: 14,
      organizationDefault: false,
    },
    {
      id: "3fcc62d1-0925-456d-890b-779b56e7289e",
      paymentTermLabelTemplate: "10 Tage - 3 %, 30 Tage netto",
      paymentTermDuration: 30,
      paymentDiscountConditions: { discountRange: 10, discountPercentage: 3 },
      organizationDefault: true,
    },
  ]
  const { client, calls } = lexwareTestClient([lexwareJsonResponse(response)])

  const result = await paymentConditionList(client)

  expect(result.success).toBe(true)
  if (result.success) expect(result.data).toMatchObject(response)
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/payment-conditions")
  expect(calls[0]?.init?.method).toBe("GET")
})

test("paymentConditionList rejects an invalid payment condition", async () => {
  const { client } = lexwareTestClient([lexwareJsonResponse([{ paymentTermDuration: "14" }])])

  const result = await paymentConditionList(client)

  expect(result.success).toBe(false)
})
