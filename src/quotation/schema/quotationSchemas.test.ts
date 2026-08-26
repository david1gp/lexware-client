import { expect, test } from "bun:test"
import type { CommandContext } from "@stricli/core"
import * as a from "valibot"
import { quotationOptions } from "../cli/quotationCreateOptions.js"
import {
  quotationCreateInputSchema,
  quotationDateTimeSchema,
  quotationLineItemSchema,
  quotationSubItemSchema,
  quotationTaxTypeSchema,
} from "./quotationSchemas.js"

const quotation = {
  voucherDate: "2026-01-01T00:00",
  expirationDate: "2026-01-31T00:00",
  address: { contactId: "contact-1" },
  lineItems: [
    {
      type: "custom",
      name: "Consulting",
      quantity: 1,
      unitName: "hour",
      unitPrice: { currency: "EUR", netAmount: 100, taxRatePercentage: 19 },
    },
  ],
  totalPrice: { currency: "EUR", totalNetAmount: 100 },
  taxConditions: { taxType: "net" },
}

test("quotation create schema accepts its domain input", () => {
  expect(a.safeParse(quotationCreateInputSchema, quotation).success).toBe(true)
})

test("quotation dates accept the API timestamp format", () => {
  expect(a.safeParse(quotationDateTimeSchema, "2026-08-26T10:00:00.000Z").success).toBe(true)
})

test("quotation nested schemas enforce item and subitem rules", () => {
  expect(
    a.safeParse(quotationLineItemSchema, {
      type: "material",
      name: "Material",
      quantity: 1,
      unitName: "piece",
      unitPrice: { currency: "EUR", netAmount: 10, taxRatePercentage: 19 },
    }).success,
  ).toBe(false)
  expect(
    a.safeParse(quotationSubItemSchema, {
      type: "text",
      name: "Note",
      alternative: false,
    }).success,
  ).toBe(false)
})

test("quotation tax constraints cover gross and VAT-free quotations", () => {
  expect(
    a.safeParse(quotationCreateInputSchema, {
      ...quotation,
      taxConditions: { taxType: "gross" },
    }).success,
  ).toBe(false)
  expect(
    a.safeParse(quotationCreateInputSchema, {
      ...quotation,
      taxConditions: { taxType: "photovoltaicEquipment" },
    }).success,
  ).toBe(false)
  expect(a.safeParse(quotationTaxTypeSchema, "photovoltaicEquipment").success).toBe(true)
})

test("quotation CLI options coerce through domain leaves", () => {
  const context = {} as CommandContext
  expect(quotationOptions.lineItemQuantity.parse.call(context, "2")).toBe(2)
  expect(() => quotationOptions.lineItemQuantity.parse.call(context, "-1")).toThrow()
  expect(quotationOptions.taxConditionsTaxType.parse.call(context, "photovoltaicEquipment")).toBe(
    "photovoltaicEquipment",
  )
})
