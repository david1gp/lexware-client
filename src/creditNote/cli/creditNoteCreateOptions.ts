import type { FlagParametersForType } from "@stricli/core"
import * as a from "valibot"
import { cliOptionCreate } from "../../cli/cliOptionCreate.js"
import { cliOptionSchemas } from "../../cli/cliOptionSchemas.js"
import {
  creditNoteAddressSchema,
  creditNoteCreateBodySchema,
  creditNoteCreateInputSchema,
  creditNoteLineItemSchema,
  creditNoteTaxConditionsSchema,
  creditNoteTotalPriceSchema,
  creditNoteUnitPriceSchema,
} from "../schema/creditNoteSchemas.js"
import type { CreditNoteCreateInputFlags } from "./creditNoteCreateInput.js"

const creditNoteOptions = {
  title: cliOptionCreate(a.unwrap(creditNoteCreateBodySchema.entries.title), "Credit-note title", { optional: true }),
  introduction: cliOptionCreate(a.unwrap(creditNoteCreateBodySchema.entries.introduction), "Credit-note introduction", {
    optional: true,
  }),
  remark: cliOptionCreate(a.unwrap(creditNoteCreateBodySchema.entries.remark), "Credit-note remark", {
    optional: true,
  }),
  printLayoutId: cliOptionCreate(a.unwrap(creditNoteCreateBodySchema.entries.printLayoutId), "Print-layout ID", {
    optional: true,
  }),
  voucherDate: cliOptionCreate(
    a.pipe(a.string(), a.isoTimestamp(), creditNoteCreateBodySchema.entries.voucherDate),
    "Voucher date",
  ),
  addressContactId: cliOptionCreate(a.unwrap(creditNoteAddressSchema.entries.contactId), "Address contact ID", {
    optional: true,
  }),
  addressName: cliOptionCreate(a.unwrap(creditNoteAddressSchema.entries.name), "Address name", { optional: true }),
  addressSupplement: cliOptionCreate(a.unwrap(creditNoteAddressSchema.entries.supplement), "Address supplement", {
    optional: true,
  }),
  addressStreet: cliOptionCreate(a.unwrap(creditNoteAddressSchema.entries.street), "Address street", {
    optional: true,
  }),
  addressCity: cliOptionCreate(a.unwrap(creditNoteAddressSchema.entries.city), "Address city", { optional: true }),
  addressZip: cliOptionCreate(a.unwrap(creditNoteAddressSchema.entries.zip), "Address ZIP code", { optional: true }),
  addressCountryCode: cliOptionCreate(a.unwrap(creditNoteAddressSchema.entries.countryCode), "Address country code", {
    optional: true,
  }),
  lineItemId: cliOptionCreate(a.unwrap(creditNoteLineItemSchema.entries.id), "Line-item ID", {
    optional: true,
    variadic: true,
  }),
  lineItemType: cliOptionCreate(creditNoteLineItemSchema.entries.type, "Line-item type", {
    optional: true,
    variadic: true,
  }),
  lineItemName: cliOptionCreate(creditNoteLineItemSchema.entries.name, "Line-item name", {
    optional: true,
    variadic: true,
  }),
  lineItemDescription: cliOptionCreate(
    a.unwrap(creditNoteLineItemSchema.entries.description),
    "Line-item description",
    {
      optional: true,
      variadic: true,
    },
  ),
  lineItemQuantity: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(creditNoteLineItemSchema.entries.quantity)),
    "Line-item quantity",
    {
      optional: true,
      variadic: true,
    },
  ),
  lineItemUnitName: cliOptionCreate(a.unwrap(creditNoteLineItemSchema.entries.unitName), "Line-item unit name", {
    optional: true,
    variadic: true,
  }),
  lineItemUnitPriceCurrency: cliOptionCreate(
    creditNoteUnitPriceSchema.entries.currency,
    "Line-item unit-price currency",
    {
      optional: true,
      variadic: true,
    },
  ),
  lineItemUnitPriceNetAmount: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(creditNoteUnitPriceSchema.entries.netAmount)),
    "Line-item unit-price net amount",
    {
      optional: true,
      variadic: true,
    },
  ),
  lineItemUnitPriceGrossAmount: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(creditNoteUnitPriceSchema.entries.grossAmount)),
    "Line-item unit-price gross amount",
    {
      optional: true,
      variadic: true,
    },
  ),
  lineItemUnitPriceTaxRatePercentage: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, creditNoteUnitPriceSchema.entries.taxRatePercentage),
    "Line-item unit-price tax rate",
    {
      optional: true,
      variadic: true,
    },
  ),
  lineItemDiscountPercentage: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(creditNoteLineItemSchema.entries.discountPercentage)),
    "Line-item discount percentage",
    {
      optional: true,
      variadic: true,
    },
  ),
  lineItemAmount: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(creditNoteLineItemSchema.entries.lineItemAmount)),
    "Line-item amount",
    {
      optional: true,
      variadic: true,
    },
  ),
  totalPriceCurrency: cliOptionCreate(creditNoteTotalPriceSchema.entries.currency, "Total-price currency", {
    optional: true,
  }),
  totalPriceTotalNetAmount: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(creditNoteTotalPriceSchema.entries.totalNetAmount)),
    "Total net amount",
    { optional: true },
  ),
  totalPriceTotalGrossAmount: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(creditNoteTotalPriceSchema.entries.totalGrossAmount)),
    "Total gross amount",
    { optional: true },
  ),
  totalPriceTotalTaxAmount: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(creditNoteTotalPriceSchema.entries.totalTaxAmount)),
    "Total tax amount",
    { optional: true },
  ),
  totalPriceTotalDiscountAbsolute: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(creditNoteTotalPriceSchema.entries.totalDiscountAbsolute)),
    "Total discount amount",
    { optional: true },
  ),
  totalPriceTotalDiscountPercentage: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(creditNoteTotalPriceSchema.entries.totalDiscountPercentage)),
    "Total discount percentage",
    { optional: true },
  ),
  taxConditionsTaxType: cliOptionCreate(creditNoteTaxConditionsSchema.entries.taxType, "Tax type", { optional: true }),
  taxConditionsTaxSubType: cliOptionCreate(a.unwrap(creditNoteTaxConditionsSchema.entries.taxSubType), "Tax subtype", {
    optional: true,
  }),
  taxConditionsTaxTypeNote: cliOptionCreate(
    a.unwrap(creditNoteTaxConditionsSchema.entries.taxTypeNote),
    "Tax type note",
    { optional: true },
  ),
} satisfies FlagParametersForType<Omit<CreditNoteCreateInputFlags, "precedingSalesVoucherId" | "finalize">>

export const creditNoteCreateOptions = {
  ...creditNoteOptions,
  precedingSalesVoucherId: cliOptionCreate(
    a.unwrap(creditNoteCreateInputSchema.entries.precedingSalesVoucherId),
    "Preceding sales voucher ID",
    { optional: true },
  ),
  finalize: cliOptionCreate(
    a.pipe(cliOptionSchemas.boolean, a.unwrap(creditNoteCreateInputSchema.entries.finalize)),
    "Finalize credit note",
    {
      optional: true,
    },
  ),
} satisfies FlagParametersForType<CreditNoteCreateInputFlags>
