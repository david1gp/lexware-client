import * as a from "valibot"
import {
  lexwareCountryCodeSchema,
  lexwareCurrencySchema,
  lexwareIdSchema,
  lexwareLineItemTypeSchema,
  lexwareNonNegativeIntegerSchema,
  lexwareNonNegativeNumberSchema,
  lexwarePercentageSchema,
  lexwareTaxSubTypeSchema,
  lexwareTaxTypeSchema,
} from "../../shared/lexwareSchemas.js"

export const downPaymentInvoiceAddressSchema = a.looseObject({
  contactId: a.optional(a.nullable(lexwareIdSchema)),
  name: a.optional(a.nullable(a.string())),
  supplement: a.optional(a.nullable(a.string())),
  street: a.optional(a.nullable(a.string())),
  city: a.optional(a.nullable(a.string())),
  zip: a.optional(a.nullable(a.string())),
  countryCode: a.optional(a.nullable(lexwareCountryCodeSchema)),
  contactPerson: a.optional(a.nullable(a.string())),
})

export const downPaymentInvoiceCurrencySchema = lexwareCurrencySchema
export const downPaymentInvoiceDateTimeSchema = a.pipe(a.string(), a.isoTimestamp())
export const downPaymentInvoiceLineItemTypeSchema = lexwareLineItemTypeSchema
export const downPaymentInvoiceUnitPriceSchema = a.looseObject({
  currency: downPaymentInvoiceCurrencySchema,
  netAmount: a.optional(a.nullable(lexwareNonNegativeNumberSchema)),
  grossAmount: a.optional(a.nullable(lexwareNonNegativeNumberSchema)),
  taxRatePercentage: lexwarePercentageSchema,
})

export const downPaymentInvoiceLineItemSchema = a.looseObject({
  id: a.optional(a.nullable(lexwareIdSchema)),
  type: downPaymentInvoiceLineItemTypeSchema,
  name: a.optional(a.nullable(a.string())),
  description: a.optional(a.nullable(a.string())),
  quantity: a.optional(a.nullable(lexwareNonNegativeNumberSchema)),
  unitName: a.optional(a.nullable(a.string())),
  unitPrice: a.optional(a.nullable(downPaymentInvoiceUnitPriceSchema)),
  discountPercentage: a.optional(a.nullable(lexwarePercentageSchema)),
  lineItemAmount: a.optional(a.nullable(lexwareNonNegativeNumberSchema)),
})

export const downPaymentInvoiceTotalPriceSchema = a.looseObject({
  currency: downPaymentInvoiceCurrencySchema,
  totalNetAmount: a.optional(a.nullable(lexwareNonNegativeNumberSchema)),
  totalGrossAmount: a.optional(a.nullable(lexwareNonNegativeNumberSchema)),
  totalTaxAmount: a.optional(a.nullable(lexwareNonNegativeNumberSchema)),
  totalDiscountAbsolute: a.optional(a.nullable(lexwareNonNegativeNumberSchema)),
  totalDiscountPercentage: a.optional(a.nullable(lexwarePercentageSchema)),
})

export const downPaymentInvoiceTaxAmountSchema = a.looseObject({
  taxRatePercentage: lexwarePercentageSchema,
  taxAmount: lexwareNonNegativeNumberSchema,
  netAmount: lexwareNonNegativeNumberSchema,
})

export const downPaymentInvoiceTaxConditionsSchema = a.looseObject({
  taxType: lexwareTaxTypeSchema,
  taxSubType: a.optional(a.nullable(lexwareTaxSubTypeSchema)),
  taxTypeNote: a.optional(a.nullable(a.string())),
})

export const downPaymentInvoicePaymentDiscountConditionsSchema = a.looseObject({
  discountPercentage: a.optional(a.nullable(lexwarePercentageSchema)),
  discountRange: a.optional(a.nullable(lexwareNonNegativeIntegerSchema)),
})

export const downPaymentInvoicePaymentConditionsSchema = a.looseObject({
  paymentTermLabel: a.optional(a.nullable(a.string())),
  paymentTermLabelTemplate: a.optional(a.nullable(a.string())),
  paymentTermDuration: a.optional(a.nullable(lexwareNonNegativeIntegerSchema)),
  paymentDiscountConditions: a.optional(a.nullable(downPaymentInvoicePaymentDiscountConditionsSchema)),
})

export const downPaymentInvoiceShippingConditionsSchema = a.looseObject({
  shippingDate: a.optional(a.nullable(downPaymentInvoiceDateTimeSchema)),
  shippingEndDate: a.optional(a.nullable(downPaymentInvoiceDateTimeSchema)),
  shippingType: a.picklist(["service", "serviceperiod", "delivery", "deliveryperiod", "none"]),
})

export const downPaymentInvoiceRelatedVoucherSchema = a.looseObject({
  id: lexwareIdSchema,
  voucherNumber: a.string(),
  voucherType: a.string(),
})

export const downPaymentInvoiceResponseSchema = a.looseObject({
  id: lexwareIdSchema,
  organizationId: lexwareIdSchema,
  createdDate: downPaymentInvoiceDateTimeSchema,
  updatedDate: downPaymentInvoiceDateTimeSchema,
  version: lexwareNonNegativeIntegerSchema,
  language: a.picklist(["de", "en"]),
  archived: a.boolean(),
  voucherStatus: a.picklist(["draft", "open", "paid", "voided"]),
  voucherNumber: a.nullable(a.string()),
  voucherDate: downPaymentInvoiceDateTimeSchema,
  dueDate: downPaymentInvoiceDateTimeSchema,
  address: downPaymentInvoiceAddressSchema,
  electronicDocumentProfile: a.optional(a.nullable(a.picklist(["NONE", "EN16931", "XRechnung"]))),
  lineItems: a.pipe(a.array(downPaymentInvoiceLineItemSchema), a.minLength(1), a.maxLength(1)),
  totalPrice: downPaymentInvoiceTotalPriceSchema,
  taxAmounts: a.array(downPaymentInvoiceTaxAmountSchema),
  taxConditions: downPaymentInvoiceTaxConditionsSchema,
  paymentConditions: downPaymentInvoicePaymentConditionsSchema,
  shippingConditions: downPaymentInvoiceShippingConditionsSchema,
  closingInvoiceId: a.nullable(lexwareIdSchema),
  relatedVouchers: a.optional(a.array(downPaymentInvoiceRelatedVoucherSchema)),
  printLayoutId: a.optional(a.nullable(lexwareIdSchema)),
  title: a.optional(a.nullable(a.string())),
  introduction: a.optional(a.nullable(a.string())),
  remark: a.optional(a.nullable(a.string())),
})

export type DownPaymentInvoiceAddress = a.InferOutput<typeof downPaymentInvoiceAddressSchema>
export type DownPaymentInvoiceDateTime = a.InferOutput<typeof downPaymentInvoiceDateTimeSchema>
export type DownPaymentInvoiceLineItem = a.InferOutput<typeof downPaymentInvoiceLineItemSchema>
export type DownPaymentInvoicePaymentConditions = a.InferOutput<typeof downPaymentInvoicePaymentConditionsSchema>
export type DownPaymentInvoiceRelatedVoucher = a.InferOutput<typeof downPaymentInvoiceRelatedVoucherSchema>
export type DownPaymentInvoiceResponse = a.InferOutput<typeof downPaymentInvoiceResponseSchema>
export type DownPaymentInvoiceShippingConditions = a.InferOutput<typeof downPaymentInvoiceShippingConditionsSchema>
export type DownPaymentInvoiceTaxAmount = a.InferOutput<typeof downPaymentInvoiceTaxAmountSchema>
export type DownPaymentInvoiceTaxConditions = a.InferOutput<typeof downPaymentInvoiceTaxConditionsSchema>
export type DownPaymentInvoiceTotalPrice = a.InferOutput<typeof downPaymentInvoiceTotalPriceSchema>
export type DownPaymentInvoiceUnitPrice = a.InferOutput<typeof downPaymentInvoiceUnitPriceSchema>
