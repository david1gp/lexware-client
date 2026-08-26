import * as a from "valibot"
import {
  lexwareAddressSchema,
  lexwareCountryCodeSchema,
  lexwareCurrencySchema,
  lexwareDateTimeSchema,
  lexwareIdSchema,
  lexwareLineItemTypeSchema,
  lexwareNonNegativeIntegerSchema,
  lexwareNonNegativeNumberSchema,
  lexwareTaxConditionsSchema,
  lexwareTaxSubTypeSchema,
  lexwareUnitPriceSchema,
} from "../../shared/lexwareSchemas.js"

export const deliveryNoteAddressSchema = lexwareAddressSchema
export const deliveryNoteCurrencySchema = lexwareCurrencySchema
export const deliveryNoteDateTimeSchema = a.union([lexwareDateTimeSchema, a.pipe(a.string(), a.isoTimestamp())])
export const deliveryNoteLineItemTypeSchema = lexwareLineItemTypeSchema
export const deliveryNoteShippingTypeSchema = a.picklist([
  "service",
  "serviceperiod",
  "delivery",
  "deliveryperiod",
  "none",
])
export const deliveryNoteTaxConditionsSchema = a.looseObject({
  ...lexwareTaxConditionsSchema.entries,
  taxSubType: a.optional(a.nullable(lexwareTaxSubTypeSchema)),
})
export const deliveryNoteUnitPriceSchema = lexwareUnitPriceSchema

export const deliveryNoteLineItemSchema = a.pipe(
  a.object({
    id: a.optional(lexwareIdSchema),
    type: deliveryNoteLineItemTypeSchema,
    name: a.pipe(a.string(), a.minLength(1)),
    description: a.optional(a.string()),
    quantity: a.optional(lexwareNonNegativeNumberSchema),
    unitName: a.optional(a.string()),
    unitPrice: a.optional(a.nullable(deliveryNoteUnitPriceSchema)),
  }),
  a.check((item) => {
    if (item.type === "text") return true

    return (
      item.quantity !== undefined &&
      item.unitName !== undefined &&
      item.unitName.length > 0 &&
      (item.type === "custom" || item.id !== undefined)
    )
  }, "custom, material, and service line items require quantity and unitName; material and service also require id"),
)

export const deliveryNoteShippingConditionsSchema = a.pipe(
  a.object({
    shippingType: deliveryNoteShippingTypeSchema,
    shippingDate: a.optional(deliveryNoteDateTimeSchema),
    shippingEndDate: a.optional(deliveryNoteDateTimeSchema),
  }),
  a.check((shipping) => {
    if (
      (shipping.shippingType === "service" ||
        shipping.shippingType === "serviceperiod" ||
        shipping.shippingType === "delivery" ||
        shipping.shippingType === "deliveryperiod") &&
      shipping.shippingDate === undefined
    ) {
      return false
    }

    if (
      (shipping.shippingType === "serviceperiod" || shipping.shippingType === "deliveryperiod") &&
      shipping.shippingEndDate === undefined
    ) {
      return false
    }

    if (shipping.shippingDate !== undefined && shipping.shippingEndDate !== undefined) {
      return Date.parse(shipping.shippingEndDate) >= Date.parse(shipping.shippingDate)
    }

    return true
  }, "shipping dates are required for the selected shipping type and shippingEndDate cannot precede shippingDate"),
)

const deliveryNoteVatFreeTaxTypes = new Set([
  "vatfree",
  "intraCommunitySupply",
  "constructionService13b",
  "externalService13b",
  "thirdPartyCountryService",
  "thirdPartyCountryDelivery",
  "photovoltaicEquipment",
])

function deliveryNoteLineItemsMatchTaxConditions(
  lineItems: readonly a.InferOutput<typeof deliveryNoteLineItemSchema>[],
  taxConditions: a.InferOutput<typeof deliveryNoteTaxConditionsSchema>,
): boolean {
  return lineItems.every((item) => {
    if (item.unitPrice === undefined || item.unitPrice === null) return true

    if (taxConditions.taxType === "gross" && item.unitPrice.grossAmount === undefined) return false
    if (taxConditions.taxType !== "gross" && item.unitPrice.netAmount === undefined) return false

    return !deliveryNoteVatFreeTaxTypes.has(taxConditions.taxType) || item.unitPrice.taxRatePercentage === 0
  })
}

export const deliveryNoteCreateBodySchema = a.pipe(
  a.object({
    title: a.optional(a.string()),
    introduction: a.optional(a.string()),
    deliveryTerms: a.optional(a.string()),
    remark: a.optional(a.string()),
    language: a.optional(a.picklist(["de", "en"])),
    printLayoutId: a.optional(lexwareIdSchema),
    voucherDate: deliveryNoteDateTimeSchema,
    address: deliveryNoteAddressSchema,
    lineItems: a.pipe(a.array(deliveryNoteLineItemSchema), a.minLength(1), a.maxLength(300)),
    taxConditions: deliveryNoteTaxConditionsSchema,
    shippingConditions: deliveryNoteShippingConditionsSchema,
  }),
  a.check(
    (deliveryNote) => deliveryNoteLineItemsMatchTaxConditions(deliveryNote.lineItems, deliveryNote.taxConditions),
    "line-item unit prices must match the delivery note tax conditions",
  ),
)

export const deliveryNoteCreateInputSchema = a.object({
  deliveryNote: deliveryNoteCreateBodySchema,
  precedingSalesVoucherId: a.optional(lexwareIdSchema),
  finalize: a.optional(a.boolean()),
})

const deliveryNoteResponseAddressSchema = a.looseObject({
  contactId: a.optional(a.nullable(lexwareIdSchema)),
  name: a.optional(a.nullable(a.string())),
  supplement: a.optional(a.nullable(a.string())),
  street: a.optional(a.nullable(a.string())),
  city: a.optional(a.nullable(a.string())),
  zip: a.optional(a.nullable(a.string())),
  countryCode: a.optional(a.nullable(lexwareCountryCodeSchema)),
  contactPerson: a.optional(a.nullable(a.string())),
})

const deliveryNoteResponseLineItemSchema = a.looseObject({
  id: a.optional(a.nullable(lexwareIdSchema)),
  type: deliveryNoteLineItemTypeSchema,
  name: a.optional(a.nullable(a.string())),
  description: a.optional(a.nullable(a.string())),
  quantity: a.optional(a.nullable(lexwareNonNegativeNumberSchema)),
  unitName: a.optional(a.nullable(a.string())),
  unitPrice: a.optional(a.nullable(deliveryNoteUnitPriceSchema)),
})

const deliveryNoteRelatedVoucherSchema = a.looseObject({
  id: lexwareIdSchema,
  voucherNumber: a.string(),
  voucherType: a.string(),
})

export const deliveryNoteResponseSchema = a.looseObject({
  id: lexwareIdSchema,
  organizationId: lexwareIdSchema,
  createdDate: deliveryNoteDateTimeSchema,
  updatedDate: deliveryNoteDateTimeSchema,
  version: lexwareNonNegativeIntegerSchema,
  language: a.picklist(["de", "en"]),
  archived: a.boolean(),
  voucherStatus: a.picklist(["draft", "open"]),
  voucherNumber: a.nullable(a.string()),
  voucherDate: deliveryNoteDateTimeSchema,
  address: deliveryNoteResponseAddressSchema,
  electronicDocumentProfile: a.literal("NONE"),
  lineItems: a.array(deliveryNoteResponseLineItemSchema),
  taxConditions: deliveryNoteTaxConditionsSchema,
  relatedVouchers: a.array(deliveryNoteRelatedVoucherSchema),
  printLayoutId: a.optional(a.nullable(lexwareIdSchema)),
  title: a.optional(a.nullable(a.string())),
  introduction: a.optional(a.nullable(a.string())),
  deliveryTerms: a.optional(a.nullable(a.string())),
  remark: a.optional(a.nullable(a.string())),
})

export const deliveryNoteCreateResponseSchema = a.object({
  id: lexwareIdSchema,
  resourceUri: a.string(),
  createdDate: deliveryNoteDateTimeSchema,
  updatedDate: deliveryNoteDateTimeSchema,
  version: lexwareNonNegativeIntegerSchema,
})

export type DeliveryNoteAddress = a.InferOutput<typeof deliveryNoteAddressSchema>
export type DeliveryNoteCreateBody = a.InferOutput<typeof deliveryNoteCreateBodySchema>
export type DeliveryNoteCreateInput = a.InferOutput<typeof deliveryNoteCreateInputSchema>
export type DeliveryNoteCreateResponse = a.InferOutput<typeof deliveryNoteCreateResponseSchema>
export type DeliveryNoteLineItem = a.InferOutput<typeof deliveryNoteLineItemSchema>
export type DeliveryNoteShippingConditions = a.InferOutput<typeof deliveryNoteShippingConditionsSchema>
export type DeliveryNoteResponse = a.InferOutput<typeof deliveryNoteResponseSchema>
export type DeliveryNoteTaxConditions = a.InferOutput<typeof deliveryNoteTaxConditionsSchema>
export type DeliveryNoteUnitPrice = a.InferOutput<typeof deliveryNoteUnitPriceSchema>
