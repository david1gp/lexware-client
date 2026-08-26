import * as a from "valibot"
import {
  lexwareAddressSchema,
  lexwareCurrencySchema,
  lexwareDateTimeSchema,
  lexwareIdSchema,
  lexwareLineItemTypeSchema,
  lexwareNonNegativeNumberSchema,
  lexwarePercentageSchema,
  lexwareTaxConditionsSchema,
  lexwareTotalPriceSchema,
  lexwareUnitPriceSchema,
} from "../../shared/lexwareSchemas.js"

export const creditNoteAddressSchema = lexwareAddressSchema
export const creditNoteCurrencySchema = lexwareCurrencySchema
export const creditNoteDateTimeSchema = lexwareDateTimeSchema
export const creditNoteLineItemTypeSchema = lexwareLineItemTypeSchema
export const creditNoteTaxConditionsSchema = lexwareTaxConditionsSchema
export const creditNoteTotalPriceSchema = lexwareTotalPriceSchema
export const creditNoteUnitPriceSchema = lexwareUnitPriceSchema

export const creditNoteLineItemSchema = a.pipe(
  a.object({
    id: a.optional(lexwareIdSchema),
    type: creditNoteLineItemTypeSchema,
    name: a.pipe(a.string(), a.minLength(1)),
    description: a.optional(a.string()),
    quantity: a.optional(lexwareNonNegativeNumberSchema),
    unitName: a.optional(a.string()),
    unitPrice: a.optional(creditNoteUnitPriceSchema),
    discountPercentage: a.optional(lexwarePercentageSchema),
    lineItemAmount: a.optional(lexwareNonNegativeNumberSchema),
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

const creditNoteVatFreeTaxTypes = new Set([
  "vatfree",
  "intraCommunitySupply",
  "constructionService13b",
  "externalService13b",
  "thirdPartyCountryService",
  "thirdPartyCountryDelivery",
])

function creditNoteLineItemsMatchTaxConditions(
  lineItems: readonly a.InferOutput<typeof creditNoteLineItemSchema>[],
  taxConditions: a.InferOutput<typeof creditNoteTaxConditionsSchema>,
): boolean {
  return lineItems.every((item) => {
    if (item.unitPrice === undefined) return item.type === "text"

    if (taxConditions.taxType === "gross" && item.unitPrice.grossAmount === undefined) return false
    if (taxConditions.taxType !== "gross" && item.unitPrice.netAmount === undefined) return false
    if (creditNoteVatFreeTaxTypes.has(taxConditions.taxType) && item.unitPrice.taxRatePercentage !== 0) return false

    return true
  })
}

export const creditNoteCreateBodySchema = a.pipe(
  a.object({
    title: a.optional(a.string()),
    introduction: a.optional(a.string()),
    remark: a.optional(a.string()),
    printLayoutId: a.optional(lexwareIdSchema),
    voucherDate: creditNoteDateTimeSchema,
    address: creditNoteAddressSchema,
    lineItems: a.pipe(a.array(creditNoteLineItemSchema), a.minLength(1), a.maxLength(300)),
    totalPrice: creditNoteTotalPriceSchema,
    taxConditions: creditNoteTaxConditionsSchema,
  }),
  a.check(
    (creditNote) => creditNoteLineItemsMatchTaxConditions(creditNote.lineItems, creditNote.taxConditions),
    "line-item unit prices must match the credit note tax conditions",
  ),
)

export const creditNoteCreateInputSchema = a.object({
  creditNote: creditNoteCreateBodySchema,
  precedingSalesVoucherId: a.optional(lexwareIdSchema),
  finalize: a.optional(a.boolean()),
})

export type CreditNoteAddress = a.InferOutput<typeof creditNoteAddressSchema>
export type CreditNoteCreateBody = a.InferOutput<typeof creditNoteCreateBodySchema>
export type CreditNoteCreateInput = a.InferOutput<typeof creditNoteCreateInputSchema>
export type CreditNoteLineItem = a.InferOutput<typeof creditNoteLineItemSchema>
export type CreditNoteTaxConditions = a.InferOutput<typeof creditNoteTaxConditionsSchema>
export type CreditNoteTotalPrice = a.InferOutput<typeof creditNoteTotalPriceSchema>
export type CreditNoteUnitPrice = a.InferOutput<typeof creditNoteUnitPriceSchema>
