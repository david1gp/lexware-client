import { expect, test } from "bun:test"
import type { CommandContext } from "@stricli/core"
import * as a from "valibot"
import { invoiceOptions } from "../cli/invoiceCreateOptions.js"
import {
  invoiceCreateInputSchema,
  invoiceDateTimeSchema,
  invoiceLineItemSchema,
  invoiceShippingConditionsSchema,
} from "./invoiceSchemas.js"

const validInvoice = {
  voucherDate: "2026-08-16T00:00",
  address: { name: "Example customer", countryCode: "DE" },
  lineItems: [
    {
      type: "custom",
      name: "Consulting",
      quantity: 1,
      unitName: "Hours",
      unitPrice: { currency: "EUR", netAmount: 100, taxRatePercentage: 19 },
    },
  ],
  totalPrice: { currency: "EUR", totalNetAmount: 100 },
  taxConditions: { taxType: "net" },
  shippingConditions: { shippingType: "none" },
} as const

test("invoice line items enforce type-specific fields", () => {
  expect(
    a.safeParse(invoiceLineItemSchema, {
      type: "material",
      name: "Material",
    }).success,
  ).toBe(false)
  expect(
    a.safeParse(invoiceLineItemSchema, {
      ...validInvoice.lineItems[0],
      type: "text",
    }).success,
  ).toBe(true)
})

test("invoice shipping conditions enforce required and ordered dates", () => {
  expect(a.safeParse(invoiceShippingConditionsSchema, { shippingType: "service" }).success).toBe(false)
  expect(
    a.safeParse(invoiceShippingConditionsSchema, {
      shippingType: "serviceperiod",
      shippingDate: "2026-08-17T00:00",
      shippingEndDate: "2026-08-16T00:00",
    }).success,
  ).toBe(false)
})

test("invoice create schema enforces tax conditions", () => {
  expect(a.safeParse(invoiceCreateInputSchema, { invoice: validInvoice }).success).toBe(true)
  expect(
    a.safeParse(invoiceCreateInputSchema, {
      invoice: {
        ...validInvoice,
        taxConditions: { taxType: "gross" },
      },
    }).success,
  ).toBe(false)
})

test("invoice dates accept the API timestamp format", () => {
  expect(a.safeParse(invoiceDateTimeSchema, "2026-08-26T10:00:00.000Z").success).toBe(true)
})

test("invoice create schema accepts preceding sales voucher ID", () => {
  expect(
    a.safeParse(invoiceCreateInputSchema, {
      invoice: validInvoice,
      precedingSalesVoucherId: "invoice-1",
    }).success,
  ).toBe(true)
})

test("invoice CLI options coerce through domain leaf schemas", () => {
  const context = {} as CommandContext
  expect(invoiceOptions.lineItemQuantity.parse.call(context, "2")).toBe(2)
  expect(() => invoiceOptions.lineItemQuantity.parse.call(context, "-1")).toThrow()
  expect(() => invoiceOptions.shippingConditionsShippingType.parse.call(context, "invalid")).toThrow()
})
