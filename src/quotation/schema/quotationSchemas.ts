import * as a from "valibot"
import {
  lexwareAddressSchema,
  lexwareCurrencySchema,
  lexwareDateTimeSchema,
  lexwareIdSchema,
  lexwareLineItemTypeSchema,
  lexwareNonNegativeNumberSchema,
  lexwarePaymentConditionsSchema,
  lexwarePaymentDiscountConditionsSchema,
  lexwarePercentageSchema,
  lexwareTaxConditionsSchema,
  lexwareTaxSubTypeSchema,
  lexwareTaxTypeSchema,
  lexwareTotalPriceSchema,
  lexwareUnitPriceSchema,
} from "../../shared/lexwareSchemas.js"

export const quotationLanguageSchema = a.picklist(["de", "en"])
export const quotationCurrencySchema = lexwareCurrencySchema
export const quotationLineItemTypeSchema = lexwareLineItemTypeSchema
export const quotationTaxTypeSchema = a.union([lexwareTaxTypeSchema, a.literal("photovoltaicEquipment")])
export const quotationTaxSubTypeSchema = lexwareTaxSubTypeSchema

export const quotationAddressSchema = lexwareAddressSchema
export const quotationDateTimeSchema = a.union([lexwareDateTimeSchema, a.pipe(a.string(), a.isoTimestamp())])
export const quotationUnitPriceSchema = lexwareUnitPriceSchema
export const quotationTotalPriceSchema = lexwareTotalPriceSchema
export const quotationPaymentConditionsSchema = lexwarePaymentConditionsSchema
export const quotationPaymentDiscountConditionsSchema = lexwarePaymentDiscountConditionsSchema

export const quotationSubItemSchema = a.pipe(
  a.object({
    id: a.optional(lexwareIdSchema),
    type: quotationLineItemTypeSchema,
    name: a.pipe(a.string(), a.minLength(1)),
    description: a.optional(a.string()),
    quantity: a.optional(lexwareNonNegativeNumberSchema),
    unitName: a.optional(a.string()),
    unitPrice: a.optional(quotationUnitPriceSchema),
    discountPercentage: a.optional(lexwarePercentageSchema),
    lineItemAmount: a.optional(lexwareNonNegativeNumberSchema),
    alternative: a.literal(true),
  }),
  a.check((item) => {
    if (item.type === "text") return true

    return (
      item.quantity !== undefined &&
      item.unitName !== undefined &&
      item.unitName.length > 0 &&
      item.unitPrice !== undefined &&
      (item.type === "custom" || item.id !== undefined)
    )
  }, "subitems require alternative=true and the fields required by their type"),
)

export const quotationLineItemSchema = a.pipe(
  a.object({
    id: a.optional(lexwareIdSchema),
    type: quotationLineItemTypeSchema,
    name: a.pipe(a.string(), a.minLength(1)),
    description: a.optional(a.string()),
    quantity: a.optional(lexwareNonNegativeNumberSchema),
    unitName: a.optional(a.string()),
    unitPrice: a.optional(quotationUnitPriceSchema),
    discountPercentage: a.optional(lexwarePercentageSchema),
    lineItemAmount: a.optional(lexwareNonNegativeNumberSchema),
    subItems: a.optional(a.pipe(a.array(quotationSubItemSchema), a.maxLength(300))),
    optional: a.optional(a.boolean()),
    alternative: a.optional(a.boolean()),
  }),
  a.check((item) => {
    if (item.type === "text") return true

    return (
      item.quantity !== undefined &&
      item.unitName !== undefined &&
      item.unitName.length > 0 &&
      item.unitPrice !== undefined &&
      (item.type === "custom" || item.id !== undefined)
    )
  }, "custom, material, and service line items require quantity, unitName, and unitPrice; material and service also require id"),
)

export const quotationTaxConditionsSchema = a.looseObject({
  ...lexwareTaxConditionsSchema.entries,
  taxType: quotationTaxTypeSchema,
})

const quotationVatFreeTaxTypes = new Set([
  "vatfree",
  "intraCommunitySupply",
  "constructionService13b",
  "externalService13b",
  "thirdPartyCountryService",
  "thirdPartyCountryDelivery",
  "photovoltaicEquipment",
])

function quotationLineItemsMatchTaxConditions(
  lineItems: readonly a.InferOutput<typeof quotationLineItemSchema>[],
  taxConditions: a.InferOutput<typeof quotationTaxConditionsSchema>,
): boolean {
  return lineItems.every((item) => {
    if (item.unitPrice === undefined) return item.type === "text"

    if (taxConditions.taxType === "gross" && item.unitPrice.grossAmount === undefined) return false
    if (taxConditions.taxType !== "gross" && item.unitPrice.netAmount === undefined) return false
    if (quotationVatFreeTaxTypes.has(taxConditions.taxType) && item.unitPrice.taxRatePercentage !== 0) return false

    return (
      item.subItems?.every((subItem) => {
        if (subItem.unitPrice === undefined) return subItem.type === "text"
        if (taxConditions.taxType === "gross" && subItem.unitPrice.grossAmount === undefined) return false
        if (taxConditions.taxType !== "gross" && subItem.unitPrice.netAmount === undefined) return false
        return !quotationVatFreeTaxTypes.has(taxConditions.taxType) || subItem.unitPrice.taxRatePercentage === 0
      }) ?? true
    )
  })
}

const quotationRequestBodySchema = a.pipe(
  a.object({
    title: a.optional(a.string()),
    introduction: a.optional(a.string()),
    remark: a.optional(a.string()),
    language: a.optional(quotationLanguageSchema),
    printLayoutId: a.optional(lexwareIdSchema),
    voucherDate: quotationDateTimeSchema,
    expirationDate: quotationDateTimeSchema,
    address: quotationAddressSchema,
    lineItems: a.pipe(a.array(quotationLineItemSchema), a.minLength(1), a.maxLength(300)),
    totalPrice: quotationTotalPriceSchema,
    taxConditions: quotationTaxConditionsSchema,
    paymentConditions: a.optional(quotationPaymentConditionsSchema),
  }),
  a.check((quotation) => {
    return quotationLineItemsMatchTaxConditions(quotation.lineItems, quotation.taxConditions)
  }, "line-item unit prices must match the quotation tax conditions"),
)

export const quotationCreateBodySchema = quotationRequestBodySchema
export const quotationCreateInputSchema = quotationCreateBodySchema
export const quotationBodySchema = quotationCreateBodySchema

export type QuotationBody = a.InferOutput<typeof quotationBodySchema>
export type QuotationAddress = a.InferOutput<typeof quotationAddressSchema>
export type QuotationCreateInput = a.InferOutput<typeof quotationCreateInputSchema>
export type QuotationLineItem = a.InferOutput<typeof quotationLineItemSchema>
export type QuotationPaymentConditions = a.InferOutput<typeof quotationPaymentConditionsSchema>
export type QuotationPaymentDiscountConditions = a.InferOutput<typeof quotationPaymentDiscountConditionsSchema>
export type QuotationSubItem = a.InferOutput<typeof quotationSubItemSchema>
export type QuotationTaxConditions = a.InferOutput<typeof quotationTaxConditionsSchema>
export type QuotationTotalPrice = a.InferOutput<typeof quotationTotalPriceSchema>
export type QuotationUnitPrice = a.InferOutput<typeof quotationUnitPriceSchema>
