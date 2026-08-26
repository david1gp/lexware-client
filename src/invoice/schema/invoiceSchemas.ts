import * as a from "valibot"
import {
  lexwareAddressSchema,
  lexwareCurrencySchema,
  lexwareDateTimeSchema,
  lexwareIdSchema,
  lexwareLineItemTypeSchema,
  lexwareNonNegativeIntegerSchema,
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

export const invoiceAddressSchema = lexwareAddressSchema
export const invoiceCurrencySchema = lexwareCurrencySchema
export const invoiceDateTimeSchema = a.union([lexwareDateTimeSchema, a.pipe(a.string(), a.isoTimestamp())])
export const invoiceLineItemTypeSchema = lexwareLineItemTypeSchema
export const invoiceTaxTypeSchema = lexwareTaxTypeSchema
export const invoiceTaxSubTypeSchema = lexwareTaxSubTypeSchema
export const invoiceUnitPriceSchema = lexwareUnitPriceSchema
export const invoiceTotalPriceSchema = lexwareTotalPriceSchema
export const invoiceTaxConditionsSchema = lexwareTaxConditionsSchema
export const invoicePaymentDiscountConditionsSchema = lexwarePaymentDiscountConditionsSchema
export const invoicePaymentConditionsSchema = lexwarePaymentConditionsSchema

export const invoiceShippingTypeSchema = a.picklist(["service", "serviceperiod", "delivery", "deliveryperiod", "none"])

export const invoiceVersionSchema = lexwareNonNegativeIntegerSchema

export const invoiceLineItemSchema = a.pipe(
  a.object({
    id: a.optional(lexwareIdSchema),
    type: invoiceLineItemTypeSchema,
    name: a.pipe(a.string(), a.minLength(1)),
    description: a.optional(a.string()),
    quantity: a.optional(lexwareNonNegativeNumberSchema),
    unitName: a.optional(a.string()),
    unitPrice: a.optional(invoiceUnitPriceSchema),
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

export const invoiceShippingConditionsSchema = a.pipe(
  a.object({
    shippingType: invoiceShippingTypeSchema,
    shippingDate: a.optional(invoiceDateTimeSchema),
    shippingEndDate: a.optional(invoiceDateTimeSchema),
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

export const invoiceXRechnungSchema = a.object({
  buyerReference: a.string(),
})

const invoiceVatFreeTaxTypes = new Set([
  "vatfree",
  "intraCommunitySupply",
  "constructionService13b",
  "externalService13b",
  "thirdPartyCountryService",
  "thirdPartyCountryDelivery",
])

function invoiceLineItemsMatchTaxConditions(
  lineItems: readonly a.InferOutput<typeof invoiceLineItemSchema>[],
  taxConditions: a.InferOutput<typeof invoiceTaxConditionsSchema>,
): boolean {
  return lineItems.every((item) => {
    if (item.unitPrice === undefined) return item.type === "text"

    if (taxConditions.taxType === "gross" && item.unitPrice.grossAmount === undefined) return false
    if (taxConditions.taxType !== "gross" && item.unitPrice.netAmount === undefined) return false
    if (invoiceVatFreeTaxTypes.has(taxConditions.taxType) && item.unitPrice.taxRatePercentage !== 0) return false

    return true
  })
}

const invoiceRequestBodySchema = a.pipe(
  a.object({
    title: a.optional(a.string()),
    introduction: a.optional(a.string()),
    remark: a.optional(a.string()),
    voucherDate: invoiceDateTimeSchema,
    address: invoiceAddressSchema,
    lineItems: a.pipe(a.array(invoiceLineItemSchema), a.minLength(1), a.maxLength(300)),
    totalPrice: invoiceTotalPriceSchema,
    taxConditions: invoiceTaxConditionsSchema,
    shippingConditions: invoiceShippingConditionsSchema,
    paymentConditions: a.optional(invoicePaymentConditionsSchema),
    xRechnung: a.optional(invoiceXRechnungSchema),
    version: a.optional(invoiceVersionSchema),
  }),
  a.check(
    (invoice) => invoiceLineItemsMatchTaxConditions(invoice.lineItems, invoice.taxConditions),
    "line-item unit prices must match the invoice tax conditions",
  ),
)

export const invoiceCreateBodySchema = invoiceRequestBodySchema

export const invoiceCreateInputSchema = a.object({
  invoice: invoiceCreateBodySchema,
  precedingSalesVoucherId: a.optional(lexwareIdSchema),
  finalize: a.optional(a.boolean()),
})

export type InvoiceAddress = a.InferOutput<typeof invoiceAddressSchema>
export type InvoiceCreateBody = a.InferOutput<typeof invoiceCreateBodySchema>
export type InvoiceCreateInput = a.InferOutput<typeof invoiceCreateInputSchema>
export type InvoiceLineItem = a.InferOutput<typeof invoiceLineItemSchema>
export type InvoicePaymentConditions = a.InferOutput<typeof invoicePaymentConditionsSchema>
export type InvoicePaymentDiscountConditions = a.InferOutput<typeof invoicePaymentDiscountConditionsSchema>
export type InvoiceShippingConditions = a.InferOutput<typeof invoiceShippingConditionsSchema>
export type InvoiceTaxConditions = a.InferOutput<typeof invoiceTaxConditionsSchema>
export type InvoiceTotalPrice = a.InferOutput<typeof invoiceTotalPriceSchema>
export type InvoiceUnitPrice = a.InferOutput<typeof invoiceUnitPriceSchema>
export type InvoiceXRechnung = a.InferOutput<typeof invoiceXRechnungSchema>
