import { expect, test } from "bun:test"
import * as a from "valibot"
import { quotationCreateInputSchema } from "../schema/quotationSchemas.js"
import type { QuotationCreateInputFlags } from "./quotationCreateInput.js"
import { quotationBodyInputFromFlags } from "./quotationCreateInput.js"

test("quotation flags assemble variadic line items and subitems through the domain schema", () => {
  const flags: QuotationCreateInputFlags = {
    voucherDate: "2026-01-01T00:00",
    expirationDate: "2026-01-31T00:00",
    addressName: "Customer",
    addressCountryCode: "DE",
    lineItemType: ["custom"],
    lineItemName: ["Consulting"],
    lineItemQuantity: [1],
    lineItemUnitName: ["hour"],
    lineItemUnitPriceCurrency: ["EUR"],
    lineItemUnitPriceNetAmount: [100],
    lineItemUnitPriceTaxRatePercentage: [19],
    lineItemSubItemParentIndex: [0],
    lineItemSubItemType: ["custom"],
    lineItemSubItemName: ["Travel"],
    lineItemSubItemQuantity: [1],
    lineItemSubItemUnitName: ["item"],
    lineItemSubItemUnitPriceCurrency: ["EUR"],
    lineItemSubItemUnitPriceNetAmount: [10],
    lineItemSubItemUnitPriceTaxRatePercentage: [19],
    totalPriceCurrency: "EUR",
    totalPriceTotalNetAmount: 110,
    taxConditionsTaxType: "net",
  }

  const result = a.safeParse(quotationCreateInputSchema, quotationBodyInputFromFlags(flags))
  expect(result.success).toBe(true)
  if (result.success) expect(result.output.lineItems[0]?.subItems).toHaveLength(1)
})

test("quotation flags reject mismatched variadic cardinality before assembly", () => {
  const result = a.safeParse(
    quotationCreateInputSchema,
    quotationBodyInputFromFlags({
      voucherDate: "2026-01-01T00:00",
      expirationDate: "2026-01-31T00:00",
      lineItemType: ["text"],
      lineItemName: ["Note", "Extra"],
    }),
  )

  expect(result.success).toBe(false)
})
