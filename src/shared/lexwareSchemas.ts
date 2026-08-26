import * as a from "valibot"

export const lexwareUnknownResponseSchema = a.unknown()

export const lexwareIdSchema = a.pipe(a.string(), a.minLength(1))

export const lexwareIdInputSchema = a.object({
  id: lexwareIdSchema,
})

export const lexwarePageQuerySchema = a.object({
  page: a.optional(a.number()),
  size: a.optional(a.number()),
})

export const lexwareCountryCodeSchema = a.pipe(a.string(), a.regex(/^[A-Z]{2}$/))

export const lexwareDateTimeSchema = a.pipe(a.string(), a.isoDateTime())

export const lexwareNonNegativeNumberSchema = a.pipe(a.number(), a.minValue(0))

export const lexwareNonNegativeIntegerSchema = a.pipe(lexwareNonNegativeNumberSchema, a.integer())

export const lexwarePercentageSchema = a.pipe(lexwareNonNegativeNumberSchema, a.maxValue(100))

export const lexwareCurrencySchema = a.literal("EUR")

export const lexwareLineItemTypeSchema = a.picklist(["custom", "material", "service", "text"])

export const lexwareTaxTypeSchema = a.picklist([
  "net",
  "gross",
  "vatfree",
  "intraCommunitySupply",
  "constructionService13b",
  "externalService13b",
  "thirdPartyCountryService",
  "thirdPartyCountryDelivery",
  "photovoltaicEquipment",
])

export const lexwareTaxSubTypeSchema = a.picklist(["distanceSales", "electronicServices"])

export const lexwareAddressSchema = a.pipe(
  a.looseObject({
    contactId: a.optional(lexwareIdSchema),
    name: a.optional(a.string()),
    supplement: a.optional(a.string()),
    street: a.optional(a.string()),
    city: a.optional(a.string()),
    zip: a.optional(a.string()),
    countryCode: a.optional(lexwareCountryCodeSchema),
  }),
  a.check(
    (address) =>
      address.contactId !== undefined ||
      (address.name !== undefined && address.name.length > 0 && address.countryCode !== undefined),
    "address requires contactId or name and countryCode",
  ),
)

export const lexwareUnitPriceSchema = a.pipe(
  a.looseObject({
    currency: lexwareCurrencySchema,
    netAmount: a.optional(lexwareNonNegativeNumberSchema),
    grossAmount: a.optional(lexwareNonNegativeNumberSchema),
    taxRatePercentage: lexwarePercentageSchema,
  }),
  a.check(
    (price) => price.netAmount !== undefined || price.grossAmount !== undefined,
    "line-item unit price requires netAmount or grossAmount",
  ),
)

export const lexwareTotalPriceSchema = a.looseObject({
  currency: lexwareCurrencySchema,
  totalNetAmount: a.optional(lexwareNonNegativeNumberSchema),
  totalGrossAmount: a.optional(lexwareNonNegativeNumberSchema),
  totalTaxAmount: a.optional(lexwareNonNegativeNumberSchema),
  totalDiscountAbsolute: a.optional(lexwareNonNegativeNumberSchema),
  totalDiscountPercentage: a.optional(lexwarePercentageSchema),
})

export const lexwareTaxConditionsSchema = a.looseObject({
  taxType: lexwareTaxTypeSchema,
  taxSubType: a.optional(lexwareTaxSubTypeSchema),
  taxTypeNote: a.optional(a.string()),
})

export const lexwarePaymentDiscountConditionsSchema = a.looseObject({
  discountPercentage: a.optional(lexwarePercentageSchema),
  discountRange: a.optional(lexwareNonNegativeIntegerSchema),
})

export const lexwarePaymentConditionsSchema = a.looseObject({
  paymentTermLabel: a.optional(a.string()),
  paymentTermDuration: a.optional(lexwareNonNegativeIntegerSchema),
  paymentDiscountConditions: a.optional(lexwarePaymentDiscountConditionsSchema),
})

export const lexwareLineItemBaseSchema = a.looseObject({
  type: a.optional(lexwareLineItemTypeSchema),
  name: a.optional(a.string()),
  description: a.optional(a.string()),
  quantity: a.optional(a.number()),
  unitName: a.optional(a.string()),
  unitPrice: a.optional(a.unknown()),
  discountPercentage: a.optional(a.number()),
  lineItemAmount: a.optional(a.number()),
})

export const lexwareLineItemSchema = lexwareLineItemBaseSchema

export const lexwareLooseBodySchema = a.looseObject({})

export type LexwareUnknownResponse = a.InferOutput<typeof lexwareUnknownResponseSchema>
