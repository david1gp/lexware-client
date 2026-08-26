import type { FlagParametersForType } from "@stricli/core"
import * as a from "valibot"
import { cliOptionCreate } from "../../cli/cliOptionCreate.js"
import { cliOptionSchemas } from "../../cli/cliOptionSchemas.js"
import {
  quotationAddressSchema,
  quotationCreateBodySchema,
  quotationLineItemSchema,
  quotationPaymentConditionsSchema,
  quotationPaymentDiscountConditionsSchema,
  quotationSubItemSchema,
  quotationTaxConditionsSchema,
  quotationTotalPriceSchema,
  quotationUnitPriceSchema,
} from "../schema/quotationSchemas.js"
import type { QuotationCreateInputFlags } from "./quotationCreateInput.js"

const quotationOptions = {
  title: cliOptionCreate(a.unwrap(quotationCreateBodySchema.entries.title), "Quotation title", { optional: true }),
  introduction: cliOptionCreate(a.unwrap(quotationCreateBodySchema.entries.introduction), "Quotation introduction", {
    optional: true,
  }),
  remark: cliOptionCreate(a.unwrap(quotationCreateBodySchema.entries.remark), "Quotation remark", { optional: true }),
  language: cliOptionCreate(a.unwrap(quotationCreateBodySchema.entries.language), "Quotation language", {
    optional: true,
  }),
  printLayoutId: cliOptionCreate(
    a.unwrap(quotationCreateBodySchema.entries.printLayoutId),
    "Quotation print-layout ID",
    {
      optional: true,
    },
  ),
  voucherDate: cliOptionCreate(quotationCreateBodySchema.entries.voucherDate, "Voucher date"),
  expirationDate: cliOptionCreate(quotationCreateBodySchema.entries.expirationDate, "Quotation expiration date"),
  addressContactId: cliOptionCreate(a.unwrap(quotationAddressSchema.entries.contactId), "Address contact ID", {
    optional: true,
  }),
  addressName: cliOptionCreate(a.unwrap(quotationAddressSchema.entries.name), "Address name", { optional: true }),
  addressSupplement: cliOptionCreate(a.unwrap(quotationAddressSchema.entries.supplement), "Address supplement", {
    optional: true,
  }),
  addressStreet: cliOptionCreate(a.unwrap(quotationAddressSchema.entries.street), "Address street", {
    optional: true,
  }),
  addressCity: cliOptionCreate(a.unwrap(quotationAddressSchema.entries.city), "Address city", { optional: true }),
  addressZip: cliOptionCreate(a.unwrap(quotationAddressSchema.entries.zip), "Address ZIP code", { optional: true }),
  addressCountryCode: cliOptionCreate(a.unwrap(quotationAddressSchema.entries.countryCode), "Address country code", {
    optional: true,
  }),
  lineItemId: cliOptionCreate(a.unwrap(quotationLineItemSchema.entries.id), "Line-item ID", {
    optional: true,
    variadic: true,
  }),
  lineItemType: cliOptionCreate(quotationLineItemSchema.entries.type, "Line-item type", {
    optional: true,
    variadic: true,
  }),
  lineItemName: cliOptionCreate(quotationLineItemSchema.entries.name, "Line-item name", {
    optional: true,
    variadic: true,
  }),
  lineItemDescription: cliOptionCreate(a.unwrap(quotationLineItemSchema.entries.description), "Line-item description", {
    optional: true,
    variadic: true,
  }),
  lineItemQuantity: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(quotationLineItemSchema.entries.quantity)),
    "Line-item quantity",
    { optional: true, variadic: true },
  ),
  lineItemUnitName: cliOptionCreate(a.unwrap(quotationLineItemSchema.entries.unitName), "Line-item unit name", {
    optional: true,
    variadic: true,
  }),
  lineItemUnitPriceCurrency: cliOptionCreate(
    quotationUnitPriceSchema.entries.currency,
    "Line-item unit-price currency",
    {
      optional: true,
      variadic: true,
    },
  ),
  lineItemUnitPriceNetAmount: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(quotationUnitPriceSchema.entries.netAmount)),
    "Line-item unit-price net amount",
    { optional: true, variadic: true },
  ),
  lineItemUnitPriceGrossAmount: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(quotationUnitPriceSchema.entries.grossAmount)),
    "Line-item unit-price gross amount",
    { optional: true, variadic: true },
  ),
  lineItemUnitPriceTaxRatePercentage: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, quotationUnitPriceSchema.entries.taxRatePercentage),
    "Line-item unit-price tax rate",
    { optional: true, variadic: true },
  ),
  lineItemDiscountPercentage: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(quotationLineItemSchema.entries.discountPercentage)),
    "Line-item discount percentage",
    { optional: true, variadic: true },
  ),
  lineItemAmount: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(quotationLineItemSchema.entries.lineItemAmount)),
    "Line-item amount",
    { optional: true, variadic: true },
  ),
  lineItemOptional: cliOptionCreate(
    a.pipe(cliOptionSchemas.boolean, a.unwrap(quotationLineItemSchema.entries.optional)),
    "Line-item is optional",
    { optional: true, variadic: true },
  ),
  lineItemAlternative: cliOptionCreate(
    a.pipe(cliOptionSchemas.boolean, a.unwrap(quotationLineItemSchema.entries.alternative)),
    "Line-item is an alternative",
    { optional: true, variadic: true },
  ),
  lineItemSubItemParentIndex: cliOptionCreate(cliOptionSchemas.integer, "Subitem parent line-item index", {
    optional: true,
    variadic: true,
  }),
  lineItemSubItemId: cliOptionCreate(a.unwrap(quotationSubItemSchema.entries.id), "Subitem ID", {
    optional: true,
    variadic: true,
  }),
  lineItemSubItemType: cliOptionCreate(quotationSubItemSchema.entries.type, "Subitem type", {
    optional: true,
    variadic: true,
  }),
  lineItemSubItemName: cliOptionCreate(quotationSubItemSchema.entries.name, "Subitem name", {
    optional: true,
    variadic: true,
  }),
  lineItemSubItemDescription: cliOptionCreate(
    a.unwrap(quotationSubItemSchema.entries.description),
    "Subitem description",
    {
      optional: true,
      variadic: true,
    },
  ),
  lineItemSubItemQuantity: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(quotationSubItemSchema.entries.quantity)),
    "Subitem quantity",
    { optional: true, variadic: true },
  ),
  lineItemSubItemUnitName: cliOptionCreate(a.unwrap(quotationSubItemSchema.entries.unitName), "Subitem unit name", {
    optional: true,
    variadic: true,
  }),
  lineItemSubItemUnitPriceCurrency: cliOptionCreate(
    quotationUnitPriceSchema.entries.currency,
    "Subitem unit-price currency",
    {
      optional: true,
      variadic: true,
    },
  ),
  lineItemSubItemUnitPriceNetAmount: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(quotationUnitPriceSchema.entries.netAmount)),
    "Subitem unit-price net amount",
    { optional: true, variadic: true },
  ),
  lineItemSubItemUnitPriceGrossAmount: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(quotationUnitPriceSchema.entries.grossAmount)),
    "Subitem unit-price gross amount",
    { optional: true, variadic: true },
  ),
  lineItemSubItemUnitPriceTaxRatePercentage: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, quotationUnitPriceSchema.entries.taxRatePercentage),
    "Subitem unit-price tax rate",
    { optional: true, variadic: true },
  ),
  lineItemSubItemDiscountPercentage: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(quotationSubItemSchema.entries.discountPercentage)),
    "Subitem discount percentage",
    { optional: true, variadic: true },
  ),
  lineItemSubItemAmount: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(quotationSubItemSchema.entries.lineItemAmount)),
    "Subitem amount",
    { optional: true, variadic: true },
  ),
  lineItemSubItemAlternative: cliOptionCreate(
    a.pipe(cliOptionSchemas.boolean, quotationSubItemSchema.entries.alternative),
    "Subitem is an alternative",
    {
      optional: true,
      variadic: true,
    },
  ),
  totalPriceCurrency: cliOptionCreate(quotationTotalPriceSchema.entries.currency, "Total-price currency", {
    optional: true,
  }),
  totalPriceTotalNetAmount: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(quotationTotalPriceSchema.entries.totalNetAmount)),
    "Total net amount",
    { optional: true },
  ),
  totalPriceTotalGrossAmount: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(quotationTotalPriceSchema.entries.totalGrossAmount)),
    "Total gross amount",
    { optional: true },
  ),
  totalPriceTotalTaxAmount: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(quotationTotalPriceSchema.entries.totalTaxAmount)),
    "Total tax amount",
    { optional: true },
  ),
  totalPriceTotalDiscountAbsolute: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(quotationTotalPriceSchema.entries.totalDiscountAbsolute)),
    "Total discount amount",
    { optional: true },
  ),
  totalPriceTotalDiscountPercentage: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(quotationTotalPriceSchema.entries.totalDiscountPercentage)),
    "Total discount percentage",
    { optional: true },
  ),
  taxConditionsTaxType: cliOptionCreate(quotationTaxConditionsSchema.entries.taxType, "Tax type", { optional: true }),
  taxConditionsTaxSubType: cliOptionCreate(a.unwrap(quotationTaxConditionsSchema.entries.taxSubType), "Tax subtype", {
    optional: true,
  }),
  taxConditionsTaxTypeNote: cliOptionCreate(
    a.unwrap(quotationTaxConditionsSchema.entries.taxTypeNote),
    "Tax type note",
    {
      optional: true,
    },
  ),
  paymentConditionsPaymentTermLabel: cliOptionCreate(
    a.unwrap(quotationPaymentConditionsSchema.entries.paymentTermLabel),
    "Payment-term label",
    {
      optional: true,
    },
  ),
  paymentConditionsPaymentTermDuration: cliOptionCreate(
    a.pipe(cliOptionSchemas.integer, a.unwrap(quotationPaymentConditionsSchema.entries.paymentTermDuration)),
    "Payment-term duration",
    { optional: true },
  ),
  paymentConditionsPaymentDiscountConditionsDiscountPercentage: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(quotationPaymentDiscountConditionsSchema.entries.discountPercentage)),
    "Payment discount percentage",
    { optional: true },
  ),
  paymentConditionsPaymentDiscountConditionsDiscountRange: cliOptionCreate(
    a.pipe(cliOptionSchemas.integer, a.unwrap(quotationPaymentDiscountConditionsSchema.entries.discountRange)),
    "Payment discount range",
    { optional: true },
  ),
} satisfies FlagParametersForType<QuotationCreateInputFlags>

const quotationCreateOptions = quotationOptions

export { quotationCreateOptions, quotationOptions }
