import { expect, test } from "bun:test"
import * as a from "valibot"
import { dunningCreateInputSchema, dunningExtraLineItemSchema } from "./dunningSchemas.js"

test("dunning schemas validate concrete extra line items and preserve extension fields", () => {
  const valid = a.safeParse(dunningCreateInputSchema, {
    precedingSalesVoucherId: "i1",
    voucherDate: "2025-01-01T00:00:00.000Z",
    extraLineItems: [
      {
        type: "service",
        name: "Fee",
        quantity: 1,
        unitName: "item",
        unitPrice: { currency: "EUR", netAmount: 10, taxRatePercentage: 19 },
        futureField: "kept",
      },
    ],
    totalNetAmount: 10,
    currency: "EUR",
  })

  expect(valid.success).toBe(true)
  expect(valid.success && valid.output.extraLineItems?.[0]?.futureField).toBe("kept")
  expect(
    a.safeParse(dunningExtraLineItemSchema, { name: "Fee", unitPrice: { currency: "EUR", taxRatePercentage: 19 } })
      .success,
  ).toBe(false)
})

test("dunning schemas reject invalid top-level and extra line-item values", () => {
  expect(
    a.safeParse(dunningCreateInputSchema, {
      precedingSalesVoucherId: "i1",
      voucherDate: "2025-01-01T00:00:00.000Z",
      extraLineItems: [{ type: "service", name: "Fee", quantity: 1, unitName: "item" }],
    }).success,
  ).toBe(false)
  expect(
    a.safeParse(dunningCreateInputSchema, {
      precedingSalesVoucherId: "i1",
      voucherDate: "2025-01-01T00:00:00.000Z",
      extraLineItems: [],
    }).success,
  ).toBe(false)
  expect(
    a.safeParse(dunningCreateInputSchema, {
      precedingSalesVoucherId: "i1",
      voucherDate: "not-a-date",
      totalNetAmount: -1,
      currency: "USD",
    }).success,
  ).toBe(false)
})
