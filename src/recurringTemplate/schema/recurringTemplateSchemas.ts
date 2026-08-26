import * as a from "valibot"
import {
  lexwareCountryCodeSchema,
  lexwareCurrencySchema,
  lexwareIdSchema,
  lexwareLineItemTypeSchema,
  lexwareNonNegativeIntegerSchema,
  lexwareNonNegativeNumberSchema,
  lexwarePercentageSchema,
} from "../../shared/lexwareSchemas.js"

export const recurringTemplateDateSchema = a.pipe(a.string(), a.isoDate())
export const recurringTemplateDateTimeSchema = a.pipe(a.string(), a.isoTimestamp())

export const recurringTemplateSortSchema = a.picklist([
  "createdDate",
  "updatedDate",
  "lastExecutionDate",
  "nextExecutionDate",
  "createdDate,ASC",
  "createdDate,DESC",
  "updatedDate,ASC",
  "updatedDate,DESC",
  "lastExecutionDate,ASC",
  "lastExecutionDate,DESC",
  "nextExecutionDate,ASC",
  "nextExecutionDate,DESC",
])

export const recurringTemplateListInputSchema = a.object({
  page: a.optional(lexwareNonNegativeIntegerSchema),
  size: a.optional(a.pipe(lexwareNonNegativeIntegerSchema, a.minValue(1), a.maxValue(250))),
  sort: a.optional(recurringTemplateSortSchema),
})

export const recurringTemplateAddressSchema = a.looseObject({
  contactId: a.optional(a.nullable(lexwareIdSchema)),
  name: a.optional(a.nullable(a.string())),
  supplement: a.optional(a.nullable(a.string())),
  street: a.optional(a.nullable(a.string())),
  city: a.optional(a.nullable(a.string())),
  zip: a.optional(a.nullable(a.string())),
  countryCode: a.optional(a.nullable(lexwareCountryCodeSchema)),
  contactPerson: a.optional(a.nullable(a.string())),
})

export const recurringTemplateCurrencySchema = lexwareCurrencySchema

export const recurringTemplateUnitPriceSchema = a.looseObject({
  currency: recurringTemplateCurrencySchema,
  netAmount: a.optional(a.nullable(lexwareNonNegativeNumberSchema)),
  grossAmount: a.optional(a.nullable(lexwareNonNegativeNumberSchema)),
  taxRatePercentage: lexwarePercentageSchema,
})

export const recurringTemplateLineItemTypeSchema = lexwareLineItemTypeSchema

export const recurringTemplateLineItemSchema = a.looseObject({
  id: a.optional(a.nullable(lexwareIdSchema)),
  type: recurringTemplateLineItemTypeSchema,
  name: a.optional(a.nullable(a.string())),
  description: a.optional(a.nullable(a.string())),
  quantity: a.optional(a.nullable(lexwareNonNegativeNumberSchema)),
  unitName: a.optional(a.nullable(a.string())),
  unitPrice: a.optional(a.nullable(recurringTemplateUnitPriceSchema)),
  discountPercentage: a.optional(a.nullable(lexwarePercentageSchema)),
  lineItemAmount: a.optional(a.nullable(lexwareNonNegativeNumberSchema)),
})

export const recurringTemplateTotalPriceSchema = a.looseObject({
  currency: recurringTemplateCurrencySchema,
  totalNetAmount: a.optional(a.nullable(lexwareNonNegativeNumberSchema)),
  totalGrossAmount: a.optional(a.nullable(lexwareNonNegativeNumberSchema)),
  totalTaxAmount: a.optional(a.nullable(lexwareNonNegativeNumberSchema)),
  totalDiscountAbsolute: a.optional(a.nullable(lexwareNonNegativeNumberSchema)),
  totalDiscountPercentage: a.optional(a.nullable(lexwarePercentageSchema)),
})

export const recurringTemplateTaxConditionsSchema = a.looseObject({
  taxType: a.picklist([
    "net",
    "gross",
    "vatfree",
    "intraCommunitySupply",
    "constructionService13b",
    "externalService13b",
    "thirdPartyCountryService",
    "thirdPartyCountryDelivery",
    "photovoltaicEquipment",
  ]),
  taxSubType: a.optional(a.nullable(a.picklist(["distanceSales", "electronicServices"]))),
  taxTypeNote: a.optional(a.nullable(a.string())),
})

export const recurringTemplatePaymentDiscountConditionsSchema = a.looseObject({
  discountPercentage: a.optional(a.nullable(lexwarePercentageSchema)),
  discountRange: a.optional(a.nullable(lexwareNonNegativeIntegerSchema)),
})

export const recurringTemplatePaymentConditionsSchema = a.looseObject({
  paymentTermLabel: a.optional(a.nullable(a.string())),
  paymentTermLabelTemplate: a.optional(a.nullable(a.string())),
  paymentTermDuration: a.optional(a.nullable(lexwareNonNegativeIntegerSchema)),
  paymentDiscountConditions: a.optional(a.nullable(recurringTemplatePaymentDiscountConditionsSchema)),
})

export const recurringTemplateSettingsSchema = a.looseObject({
  id: lexwareIdSchema,
  startDate: a.optional(a.nullable(recurringTemplateDateSchema)),
  endDate: a.optional(a.nullable(recurringTemplateDateSchema)),
  finalize: a.boolean(),
  shippingType: a.picklist(["service", "serviceperiod", "delivery", "deliveryperiod", "none"]),
  retroactiveInvoice: a.boolean(),
  executionInterval: a.picklist(["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "BIANNUALLY", "ANNUALLY"]),
  nextExecutionDate: a.optional(a.nullable(recurringTemplateDateSchema)),
  lastExecutionDate: a.optional(a.nullable(recurringTemplateDateSchema)),
  lastExecutionFailed: a.boolean(),
  lastExecutionErrorMessage: a.optional(a.nullable(a.string())),
  executionStatus: a.picklist(["ACTIVE", "PAUSED", "ENDED"]),
})

export const recurringTemplateTaxAmountSchema = a.looseObject({
  taxRatePercentage: lexwarePercentageSchema,
  taxAmount: lexwareNonNegativeNumberSchema,
  netAmount: lexwareNonNegativeNumberSchema,
})

export const recurringTemplateResponseSchema = a.looseObject({
  id: lexwareIdSchema,
  organizationId: lexwareIdSchema,
  createdDate: recurringTemplateDateTimeSchema,
  updatedDate: recurringTemplateDateTimeSchema,
  version: lexwareNonNegativeIntegerSchema,
  language: a.picklist(["de", "en"]),
  archived: a.boolean(),
  address: recurringTemplateAddressSchema,
  lineItems: a.pipe(a.array(recurringTemplateLineItemSchema), a.minLength(1), a.maxLength(300)),
  totalPrice: recurringTemplateTotalPriceSchema,
  taxAmounts: a.array(recurringTemplateTaxAmountSchema),
  taxConditions: recurringTemplateTaxConditionsSchema,
  paymentConditions: recurringTemplatePaymentConditionsSchema,
  title: a.optional(a.nullable(a.string())),
  introduction: a.optional(a.nullable(a.string())),
  remark: a.optional(a.nullable(a.string())),
  recurringTemplateSettings: recurringTemplateSettingsSchema,
})

export const recurringTemplateListItemSchema = a.looseObject({
  id: lexwareIdSchema,
  organizationId: lexwareIdSchema,
  title: a.optional(a.nullable(a.string())),
  createdDate: recurringTemplateDateTimeSchema,
  updatedDate: recurringTemplateDateTimeSchema,
  address: recurringTemplateAddressSchema,
  totalPrice: recurringTemplateTotalPriceSchema,
  paymentConditions: recurringTemplatePaymentConditionsSchema,
  recurringTemplateSettings: recurringTemplateSettingsSchema,
})

export const recurringTemplateSortResponseSchema = a.looseObject({
  property: a.picklist(["createdDate", "updatedDate", "lastExecutionDate", "nextExecutionDate"]),
  direction: a.picklist(["ASC", "DESC"]),
  ignoreCase: a.boolean(),
  nullHandling: a.picklist(["NATIVE", "NULLS_FIRST", "NULLS_LAST"]),
  ascending: a.boolean(),
})

export const recurringTemplateListResponseSchema = a.object({
  content: a.array(recurringTemplateListItemSchema),
  first: a.boolean(),
  last: a.boolean(),
  totalPages: lexwareNonNegativeIntegerSchema,
  totalElements: lexwareNonNegativeIntegerSchema,
  numberOfElements: lexwareNonNegativeIntegerSchema,
  size: lexwareNonNegativeIntegerSchema,
  number: lexwareNonNegativeIntegerSchema,
  sort: a.array(recurringTemplateSortResponseSchema),
})

export type RecurringTemplate = a.InferOutput<typeof recurringTemplateResponseSchema>
export type RecurringTemplateAddress = a.InferOutput<typeof recurringTemplateAddressSchema>
export type RecurringTemplateCurrency = a.InferOutput<typeof recurringTemplateCurrencySchema>
export type RecurringTemplateDate = a.InferOutput<typeof recurringTemplateDateSchema>
export type RecurringTemplateDateTime = a.InferOutput<typeof recurringTemplateDateTimeSchema>
export type RecurringTemplateLineItem = a.InferOutput<typeof recurringTemplateLineItemSchema>
export type RecurringTemplateListInput = a.InferOutput<typeof recurringTemplateListInputSchema>
export type RecurringTemplateListItem = a.InferOutput<typeof recurringTemplateListItemSchema>
export type RecurringTemplateListResponse = a.InferOutput<typeof recurringTemplateListResponseSchema>
export type RecurringTemplatePaymentConditions = a.InferOutput<typeof recurringTemplatePaymentConditionsSchema>
export type RecurringTemplatePaymentDiscountConditions = a.InferOutput<
  typeof recurringTemplatePaymentDiscountConditionsSchema
>
export type RecurringTemplateResponse = RecurringTemplate
export type RecurringTemplateSettings = a.InferOutput<typeof recurringTemplateSettingsSchema>
export type RecurringTemplateSort = a.InferOutput<typeof recurringTemplateSortSchema>
export type RecurringTemplateSortResponse = a.InferOutput<typeof recurringTemplateSortResponseSchema>
export type RecurringTemplateTaxAmount = a.InferOutput<typeof recurringTemplateTaxAmountSchema>
export type RecurringTemplateTaxConditions = a.InferOutput<typeof recurringTemplateTaxConditionsSchema>
export type RecurringTemplateTotalPrice = a.InferOutput<typeof recurringTemplateTotalPriceSchema>
export type RecurringTemplateUnitPrice = a.InferOutput<typeof recurringTemplateUnitPriceSchema>
