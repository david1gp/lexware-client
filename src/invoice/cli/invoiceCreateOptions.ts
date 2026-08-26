import type { FlagParametersForType } from "@stricli/core"
import * as a from "valibot"
import { cliOptionCreate } from "../../cli/cliOptionCreate.js"
import { cliOptionSchemas } from "../../cli/cliOptionSchemas.js"
import { lexwareIdSchema } from "../../shared/lexwareSchemas.js"
import {
  invoiceAddressSchema,
  invoiceCreateBodySchema,
  invoiceCreateInputSchema,
  invoiceCurrencySchema,
  invoiceLineItemSchema,
  invoicePaymentConditionsSchema,
  invoicePaymentDiscountConditionsSchema,
  invoiceShippingConditionsSchema,
  invoiceTaxConditionsSchema,
  invoiceTotalPriceSchema,
  invoiceUnitPriceSchema,
  invoiceXRechnungSchema,
} from "../schema/invoiceSchemas.js"
import type { InvoiceCreateInputFlags } from "./invoiceCreateInput.js"

export const invoiceOptions = {
  title: cliOptionCreate(a.unwrap(invoiceCreateBodySchema.entries.title), "Invoice title", { optional: true }),
  introduction: cliOptionCreate(a.unwrap(invoiceCreateBodySchema.entries.introduction), "Invoice introduction", {
    optional: true,
  }),
  remark: cliOptionCreate(a.unwrap(invoiceCreateBodySchema.entries.remark), "Invoice remark", { optional: true }),
  voucherDate: cliOptionCreate(invoiceCreateBodySchema.entries.voucherDate, "Voucher date"),
  addressContactId: cliOptionCreate(a.unwrap(invoiceAddressSchema.entries.contactId), "Address contact ID", {
    optional: true,
  }),
  addressName: cliOptionCreate(a.unwrap(invoiceAddressSchema.entries.name), "Address name", { optional: true }),
  addressSupplement: cliOptionCreate(a.unwrap(invoiceAddressSchema.entries.supplement), "Address supplement", {
    optional: true,
  }),
  addressStreet: cliOptionCreate(a.unwrap(invoiceAddressSchema.entries.street), "Address street", {
    optional: true,
  }),
  addressCity: cliOptionCreate(a.unwrap(invoiceAddressSchema.entries.city), "Address city", { optional: true }),
  addressZip: cliOptionCreate(a.unwrap(invoiceAddressSchema.entries.zip), "Address ZIP code", { optional: true }),
  addressCountryCode: cliOptionCreate(a.unwrap(invoiceAddressSchema.entries.countryCode), "Address country code", {
    optional: true,
  }),
  lineItemId: cliOptionCreate(a.unwrap(invoiceLineItemSchema.entries.id), "Line-item ID", {
    optional: true,
    variadic: true,
  }),
  lineItemType: cliOptionCreate(invoiceLineItemSchema.entries.type, "Line-item type", {
    optional: true,
    variadic: true,
  }),
  lineItemName: cliOptionCreate(invoiceLineItemSchema.entries.name, "Line-item name", {
    optional: true,
    variadic: true,
  }),
  lineItemDescription: cliOptionCreate(a.unwrap(invoiceLineItemSchema.entries.description), "Line-item description", {
    optional: true,
    variadic: true,
  }),
  lineItemQuantity: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(invoiceLineItemSchema.entries.quantity)),
    "Line-item quantity",
    { optional: true, variadic: true },
  ),
  lineItemUnitName: cliOptionCreate(a.unwrap(invoiceLineItemSchema.entries.unitName), "Line-item unit name", {
    optional: true,
    variadic: true,
  }),
  lineItemUnitPriceCurrency: cliOptionCreate(invoiceUnitPriceSchema.entries.currency, "Line-item unit-price currency", {
    optional: true,
    variadic: true,
  }),
  lineItemUnitPriceNetAmount: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(invoiceUnitPriceSchema.entries.netAmount)),
    "Line-item unit-price net amount",
    { optional: true, variadic: true },
  ),
  lineItemUnitPriceGrossAmount: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(invoiceUnitPriceSchema.entries.grossAmount)),
    "Line-item unit-price gross amount",
    { optional: true, variadic: true },
  ),
  lineItemUnitPriceTaxRatePercentage: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, invoiceUnitPriceSchema.entries.taxRatePercentage),
    "Line-item unit-price tax rate",
    { optional: true, variadic: true },
  ),
  lineItemDiscountPercentage: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(invoiceLineItemSchema.entries.discountPercentage)),
    "Line-item discount percentage",
    { optional: true, variadic: true },
  ),
  lineItemAmount: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(invoiceLineItemSchema.entries.lineItemAmount)),
    "Line-item amount",
    { optional: true, variadic: true },
  ),
  totalPriceCurrency: cliOptionCreate(invoiceCurrencySchema, "Total-price currency", {
    optional: true,
  }),
  totalPriceTotalNetAmount: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(invoiceTotalPriceSchema.entries.totalNetAmount)),
    "Total net amount",
    { optional: true },
  ),
  totalPriceTotalGrossAmount: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(invoiceTotalPriceSchema.entries.totalGrossAmount)),
    "Total gross amount",
    { optional: true },
  ),
  totalPriceTotalTaxAmount: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(invoiceTotalPriceSchema.entries.totalTaxAmount)),
    "Total tax amount",
    { optional: true },
  ),
  totalPriceTotalDiscountAbsolute: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(invoiceTotalPriceSchema.entries.totalDiscountAbsolute)),
    "Total discount amount",
    { optional: true },
  ),
  totalPriceTotalDiscountPercentage: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(invoiceTotalPriceSchema.entries.totalDiscountPercentage)),
    "Total discount percentage",
    { optional: true },
  ),
  taxConditionsTaxType: cliOptionCreate(invoiceTaxConditionsSchema.entries.taxType, "Tax type", { optional: true }),
  taxConditionsTaxSubType: cliOptionCreate(a.unwrap(invoiceTaxConditionsSchema.entries.taxSubType), "Tax subtype", {
    optional: true,
  }),
  taxConditionsTaxTypeNote: cliOptionCreate(a.unwrap(invoiceTaxConditionsSchema.entries.taxTypeNote), "Tax type note", {
    optional: true,
  }),
  shippingConditionsShippingType: cliOptionCreate(
    invoiceShippingConditionsSchema.entries.shippingType,
    "Shipping type",
    { optional: true },
  ),
  shippingConditionsShippingDate: cliOptionCreate(
    a.unwrap(invoiceShippingConditionsSchema.entries.shippingDate),
    "Shipping date",
    { optional: true },
  ),
  shippingConditionsShippingEndDate: cliOptionCreate(
    a.unwrap(invoiceShippingConditionsSchema.entries.shippingEndDate),
    "Shipping end date",
    { optional: true },
  ),
  paymentConditionsPaymentTermLabel: cliOptionCreate(
    a.unwrap(invoicePaymentConditionsSchema.entries.paymentTermLabel),
    "Payment-term label",
    { optional: true },
  ),
  paymentConditionsPaymentTermDuration: cliOptionCreate(
    a.pipe(cliOptionSchemas.integer, a.unwrap(invoicePaymentConditionsSchema.entries.paymentTermDuration)),
    "Payment-term duration",
    { optional: true },
  ),
  paymentConditionsPaymentDiscountConditionsDiscountPercentage: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(invoicePaymentDiscountConditionsSchema.entries.discountPercentage)),
    "Payment discount percentage",
    { optional: true },
  ),
  paymentConditionsPaymentDiscountConditionsDiscountRange: cliOptionCreate(
    a.pipe(cliOptionSchemas.integer, a.unwrap(invoicePaymentDiscountConditionsSchema.entries.discountRange)),
    "Payment discount range",
    { optional: true },
  ),
  xRechnungBuyerReference: cliOptionCreate(invoiceXRechnungSchema.entries.buyerReference, "XRechnung buyer reference", {
    optional: true,
  }),
  version: cliOptionCreate(
    a.pipe(cliOptionSchemas.integer, a.unwrap(invoiceCreateBodySchema.entries.version)),
    "Invoice version",
    { optional: true },
  ),
} satisfies FlagParametersForType<Omit<InvoiceCreateInputFlags, "finalize" | "precedingSalesVoucherId">>

export const invoiceCreateOptions = {
  ...invoiceOptions,
  precedingSalesVoucherId: cliOptionCreate(lexwareIdSchema, "Preceding sales voucher ID", { optional: true }),
  finalize: cliOptionCreate(
    a.pipe(cliOptionSchemas.boolean, a.unwrap(invoiceCreateInputSchema.entries.finalize)),
    "Finalize invoice",
    {
      optional: true,
    },
  ),
} satisfies FlagParametersForType<InvoiceCreateInputFlags>
