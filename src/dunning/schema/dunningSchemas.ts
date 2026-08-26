import * as a from "valibot"
import {
  lexwareCurrencySchema,
  lexwareIdSchema,
  lexwareLineItemTypeSchema,
  lexwareNonNegativeNumberSchema,
  lexwarePercentageSchema,
  lexwareUnitPriceSchema,
} from "../../shared/lexwareSchemas.js"

export const dunningPrecedingSalesVoucherIdSchema = lexwareIdSchema
export const dunningFinalizeSchema = a.boolean()
export const dunningTitleSchema = a.string()
export const dunningDateTimeSchema = a.pipe(a.string(), a.isoTimestamp())
export const dunningVoucherDateSchema = dunningDateTimeSchema
export const dunningCurrencySchema = lexwareCurrencySchema

export const dunningLineItemTypeSchema = lexwareLineItemTypeSchema
export const dunningExtraLineItemTypeSchema = dunningLineItemTypeSchema
export const dunningExtraLineItemNameSchema = a.pipe(a.string(), a.minLength(1))
export const dunningExtraLineItemDescriptionSchema = a.string()
export const dunningExtraLineItemQuantitySchema = lexwareNonNegativeNumberSchema
export const dunningExtraLineItemUnitNameSchema = a.string()
export const dunningUnitPriceSchema = lexwareUnitPriceSchema
export const dunningExtraLineItemUnitPriceCurrencySchema = lexwareCurrencySchema
export const dunningExtraLineItemUnitPriceNetAmountSchema = lexwareNonNegativeNumberSchema
export const dunningExtraLineItemUnitPriceGrossAmountSchema = lexwareNonNegativeNumberSchema
export const dunningExtraLineItemUnitPriceTaxRatePercentageSchema = lexwarePercentageSchema
export const dunningExtraLineItemDiscountPercentageSchema = lexwarePercentageSchema
export const dunningExtraLineItemAmountSchema = lexwareNonNegativeNumberSchema

export const dunningExtraLineItemSchema = a.pipe(
  a.looseObject({
    type: a.optional(dunningExtraLineItemTypeSchema),
    name: dunningExtraLineItemNameSchema,
    description: a.optional(dunningExtraLineItemDescriptionSchema),
    quantity: a.optional(dunningExtraLineItemQuantitySchema),
    unitName: a.optional(dunningExtraLineItemUnitNameSchema),
    unitPrice: a.optional(dunningUnitPriceSchema),
    discountPercentage: a.optional(dunningExtraLineItemDiscountPercentageSchema),
    lineItemAmount: a.optional(dunningExtraLineItemAmountSchema),
  }),
  a.check((item) => {
    if (item.type === undefined || item.type === "text") return true

    return (
      item.quantity !== undefined &&
      item.unitName !== undefined &&
      item.unitName.length > 0 &&
      item.unitPrice !== undefined
    )
  }, "non-text extra line items require quantity, unitName, and unitPrice"),
)

export const dunningExtraLineItemsSchema = a.pipe(a.array(dunningExtraLineItemSchema), a.minLength(1), a.maxLength(300))

export const dunningTotalNetAmountSchema = lexwareNonNegativeNumberSchema

export const dunningCreateInputSchema = a.object({
  precedingSalesVoucherId: dunningPrecedingSalesVoucherIdSchema,
  finalize: a.optional(dunningFinalizeSchema),
  title: a.optional(dunningTitleSchema),
  voucherDate: dunningVoucherDateSchema,
  extraLineItems: a.optional(dunningExtraLineItemsSchema),
  totalNetAmount: a.optional(dunningTotalNetAmountSchema),
  currency: a.optional(dunningCurrencySchema),
})

export type DunningExtraLineItem = a.InferOutput<typeof dunningExtraLineItemSchema>
export type DunningUnitPrice = a.InferOutput<typeof dunningUnitPriceSchema>
export type DunningCreateInput = a.InferOutput<typeof dunningCreateInputSchema>
