import type { FlagParametersForType } from "@stricli/core"
import * as a from "valibot"
import { cliOptionCreate } from "../../cli/cliOptionCreate.js"
import { cliOptionSchemas } from "../../cli/cliOptionSchemas.js"
import { lexwareTaxSubTypeSchema } from "../../shared/lexwareSchemas.js"
import {
  deliveryNoteAddressSchema,
  deliveryNoteCreateBodySchema,
  deliveryNoteCreateInputSchema,
  deliveryNoteLineItemSchema,
  deliveryNoteShippingConditionsSchema,
  deliveryNoteTaxConditionsSchema,
  deliveryNoteUnitPriceSchema,
} from "../schema/deliveryNoteSchemas.js"
import type { DeliveryNoteCreateInputFlags } from "./deliveryNoteCreateInput.js"

const deliveryNoteOptions = {
  title: cliOptionCreate(a.unwrap(deliveryNoteCreateBodySchema.entries.title), "Delivery-note title", {
    optional: true,
  }),
  introduction: cliOptionCreate(
    a.unwrap(deliveryNoteCreateBodySchema.entries.introduction),
    "Delivery-note introduction",
    {
      optional: true,
    },
  ),
  deliveryTerms: cliOptionCreate(a.unwrap(deliveryNoteCreateBodySchema.entries.deliveryTerms), "Delivery terms", {
    optional: true,
  }),
  remark: cliOptionCreate(a.unwrap(deliveryNoteCreateBodySchema.entries.remark), "Delivery-note remark", {
    optional: true,
  }),
  language: cliOptionCreate(a.unwrap(deliveryNoteCreateBodySchema.entries.language), "Language", { optional: true }),
  printLayoutId: cliOptionCreate(a.unwrap(deliveryNoteCreateBodySchema.entries.printLayoutId), "Print-layout ID", {
    optional: true,
  }),
  voucherDate: cliOptionCreate(deliveryNoteCreateBodySchema.entries.voucherDate, "Voucher date"),
  addressContactId: cliOptionCreate(a.unwrap(deliveryNoteAddressSchema.entries.contactId), "Address contact ID", {
    optional: true,
  }),
  addressName: cliOptionCreate(a.unwrap(deliveryNoteAddressSchema.entries.name), "Address name", { optional: true }),
  addressSupplement: cliOptionCreate(a.unwrap(deliveryNoteAddressSchema.entries.supplement), "Address supplement", {
    optional: true,
  }),
  addressStreet: cliOptionCreate(a.unwrap(deliveryNoteAddressSchema.entries.street), "Address street", {
    optional: true,
  }),
  addressCity: cliOptionCreate(a.unwrap(deliveryNoteAddressSchema.entries.city), "Address city", { optional: true }),
  addressZip: cliOptionCreate(a.unwrap(deliveryNoteAddressSchema.entries.zip), "Address ZIP code", { optional: true }),
  addressCountryCode: cliOptionCreate(a.unwrap(deliveryNoteAddressSchema.entries.countryCode), "Address country code", {
    optional: true,
  }),
  lineItemId: cliOptionCreate(a.unwrap(deliveryNoteLineItemSchema.entries.id), "Line-item ID", {
    optional: true,
    variadic: true,
  }),
  lineItemType: cliOptionCreate(deliveryNoteLineItemSchema.entries.type, "Line-item type", {
    optional: true,
    variadic: true,
  }),
  lineItemName: cliOptionCreate(deliveryNoteLineItemSchema.entries.name, "Line-item name", {
    optional: true,
    variadic: true,
  }),
  lineItemDescription: cliOptionCreate(
    a.unwrap(deliveryNoteLineItemSchema.entries.description),
    "Line-item description",
    {
      optional: true,
      variadic: true,
    },
  ),
  lineItemQuantity: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(deliveryNoteLineItemSchema.entries.quantity)),
    "Line-item quantity",
    { optional: true, variadic: true },
  ),
  lineItemUnitName: cliOptionCreate(a.unwrap(deliveryNoteLineItemSchema.entries.unitName), "Line-item unit name", {
    optional: true,
    variadic: true,
  }),
  lineItemUnitPriceCurrency: cliOptionCreate(
    deliveryNoteUnitPriceSchema.entries.currency,
    "Line-item unit-price currency",
    {
      optional: true,
      variadic: true,
    },
  ),
  lineItemUnitPriceNetAmount: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(deliveryNoteUnitPriceSchema.entries.netAmount)),
    "Line-item unit-price net amount",
    { optional: true, variadic: true },
  ),
  lineItemUnitPriceGrossAmount: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(deliveryNoteUnitPriceSchema.entries.grossAmount)),
    "Line-item unit-price gross amount",
    { optional: true, variadic: true },
  ),
  lineItemUnitPriceTaxRatePercentage: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, deliveryNoteUnitPriceSchema.entries.taxRatePercentage),
    "Line-item unit-price tax rate",
    { optional: true, variadic: true },
  ),
  taxConditionsTaxType: cliOptionCreate(deliveryNoteTaxConditionsSchema.entries.taxType, "Tax type", {
    optional: true,
  }),
  taxConditionsTaxSubType: cliOptionCreate(lexwareTaxSubTypeSchema, "Tax subtype", {
    optional: true,
  }),
  taxConditionsTaxTypeNote: cliOptionCreate(a.string(), "Tax type note", {
    optional: true,
  }),
  shippingConditionsShippingType: cliOptionCreate(
    deliveryNoteShippingConditionsSchema.entries.shippingType,
    "Shipping type",
    { optional: true },
  ),
  shippingConditionsShippingDate: cliOptionCreate(
    a.unwrap(deliveryNoteShippingConditionsSchema.entries.shippingDate),
    "Shipping date",
    { optional: true },
  ),
  shippingConditionsShippingEndDate: cliOptionCreate(
    a.unwrap(deliveryNoteShippingConditionsSchema.entries.shippingEndDate),
    "Shipping end date",
    { optional: true },
  ),
} satisfies FlagParametersForType<Omit<DeliveryNoteCreateInputFlags, "precedingSalesVoucherId" | "finalize">>

export const deliveryNoteCreateOptions = {
  ...deliveryNoteOptions,
  precedingSalesVoucherId: cliOptionCreate(
    a.unwrap(deliveryNoteCreateInputSchema.entries.precedingSalesVoucherId),
    "Preceding sales voucher ID",
    { optional: true },
  ),
  finalize: cliOptionCreate(
    a.pipe(cliOptionSchemas.boolean, a.unwrap(deliveryNoteCreateInputSchema.entries.finalize)),
    "Finalize delivery note",
    { optional: true },
  ),
} satisfies FlagParametersForType<DeliveryNoteCreateInputFlags>
