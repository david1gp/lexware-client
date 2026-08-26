import type {
  InvoiceAddress,
  InvoiceCreateBody,
  InvoiceCreateInput,
  InvoiceLineItem,
  InvoicePaymentConditions,
  InvoicePaymentDiscountConditions,
  InvoiceShippingConditions,
  InvoiceTaxConditions,
  InvoiceTotalPrice,
  InvoiceUnitPrice,
  InvoiceXRechnung,
} from "../schema/invoiceSchemas.js"

type InvoiceCreateInputFlags = {
  readonly precedingSalesVoucherId?: InvoiceCreateInput["precedingSalesVoucherId"]
  readonly title?: InvoiceCreateBody["title"]
  readonly introduction?: InvoiceCreateBody["introduction"]
  readonly remark?: InvoiceCreateBody["remark"]
  readonly voucherDate: InvoiceCreateBody["voucherDate"]
  readonly addressContactId?: InvoiceAddress["contactId"]
  readonly addressName?: InvoiceAddress["name"]
  readonly addressSupplement?: InvoiceAddress["supplement"]
  readonly addressStreet?: InvoiceAddress["street"]
  readonly addressCity?: InvoiceAddress["city"]
  readonly addressZip?: InvoiceAddress["zip"]
  readonly addressCountryCode?: InvoiceAddress["countryCode"]
  readonly lineItemId?: NonNullable<InvoiceLineItem["id"]>[]
  readonly lineItemType?: InvoiceLineItem["type"][]
  readonly lineItemName?: InvoiceLineItem["name"][]
  readonly lineItemDescription?: NonNullable<InvoiceLineItem["description"]>[]
  readonly lineItemQuantity?: NonNullable<InvoiceLineItem["quantity"]>[]
  readonly lineItemUnitName?: NonNullable<InvoiceLineItem["unitName"]>[]
  readonly lineItemUnitPriceCurrency?: NonNullable<InvoiceUnitPrice["currency"]>[]
  readonly lineItemUnitPriceNetAmount?: NonNullable<InvoiceUnitPrice["netAmount"]>[]
  readonly lineItemUnitPriceGrossAmount?: NonNullable<InvoiceUnitPrice["grossAmount"]>[]
  readonly lineItemUnitPriceTaxRatePercentage?: NonNullable<InvoiceUnitPrice["taxRatePercentage"]>[]
  readonly lineItemDiscountPercentage?: NonNullable<InvoiceLineItem["discountPercentage"]>[]
  readonly lineItemAmount?: NonNullable<InvoiceLineItem["lineItemAmount"]>[]
  readonly totalPriceCurrency?: InvoiceTotalPrice["currency"]
  readonly totalPriceTotalNetAmount?: NonNullable<InvoiceTotalPrice["totalNetAmount"]>
  readonly totalPriceTotalGrossAmount?: NonNullable<InvoiceTotalPrice["totalGrossAmount"]>
  readonly totalPriceTotalTaxAmount?: NonNullable<InvoiceTotalPrice["totalTaxAmount"]>
  readonly totalPriceTotalDiscountAbsolute?: NonNullable<InvoiceTotalPrice["totalDiscountAbsolute"]>
  readonly totalPriceTotalDiscountPercentage?: NonNullable<InvoiceTotalPrice["totalDiscountPercentage"]>
  readonly taxConditionsTaxType?: InvoiceTaxConditions["taxType"]
  readonly taxConditionsTaxSubType?: InvoiceTaxConditions["taxSubType"]
  readonly taxConditionsTaxTypeNote?: InvoiceTaxConditions["taxTypeNote"]
  readonly shippingConditionsShippingType?: InvoiceShippingConditions["shippingType"]
  readonly shippingConditionsShippingDate?: NonNullable<InvoiceShippingConditions["shippingDate"]>
  readonly shippingConditionsShippingEndDate?: NonNullable<InvoiceShippingConditions["shippingEndDate"]>
  readonly paymentConditionsPaymentTermLabel?: InvoicePaymentConditions["paymentTermLabel"]
  readonly paymentConditionsPaymentTermDuration?: NonNullable<InvoicePaymentConditions["paymentTermDuration"]>
  readonly paymentConditionsPaymentDiscountConditionsDiscountPercentage?: NonNullable<
    InvoicePaymentDiscountConditions["discountPercentage"]
  >
  readonly paymentConditionsPaymentDiscountConditionsDiscountRange?: NonNullable<
    InvoicePaymentDiscountConditions["discountRange"]
  >
  readonly xRechnungBuyerReference?: InvoiceXRechnung["buyerReference"]
  readonly finalize?: NonNullable<InvoiceCreateInput["finalize"]>
  readonly version?: NonNullable<InvoiceCreateBody["version"]>
}

export type { InvoiceCreateInputFlags }

function invoiceFlagArrays(flags: InvoiceCreateInputFlags): readonly (readonly unknown[])[] {
  return [
    flags.lineItemId,
    flags.lineItemType,
    flags.lineItemName,
    flags.lineItemDescription,
    flags.lineItemQuantity,
    flags.lineItemUnitName,
    flags.lineItemUnitPriceCurrency,
    flags.lineItemUnitPriceNetAmount,
    flags.lineItemUnitPriceGrossAmount,
    flags.lineItemUnitPriceTaxRatePercentage,
    flags.lineItemDiscountPercentage,
    flags.lineItemAmount,
  ].filter((value): value is string[] | number[] => value !== undefined && value.length > 0)
}

function invoiceLineItemCount(flags: InvoiceCreateInputFlags): number {
  return Math.max(...invoiceFlagArrays(flags).map((values) => values.length), 0)
}

function invoiceUnitPriceFromFlags(flags: InvoiceCreateInputFlags, index: number): unknown {
  const unitPriceProvided = [
    flags.lineItemUnitPriceCurrency,
    flags.lineItemUnitPriceNetAmount,
    flags.lineItemUnitPriceGrossAmount,
    flags.lineItemUnitPriceTaxRatePercentage,
  ].some((values) => values !== undefined && values.length > 0)

  if (!unitPriceProvided) return undefined

  return {
    currency: flags.lineItemUnitPriceCurrency?.[index],
    netAmount: flags.lineItemUnitPriceNetAmount?.[index],
    grossAmount: flags.lineItemUnitPriceGrossAmount?.[index],
    taxRatePercentage: flags.lineItemUnitPriceTaxRatePercentage?.[index],
  }
}

function invoiceBodyInputFromFlags(flags: InvoiceCreateInputFlags): unknown {
  const itemCount = invoiceLineItemCount(flags)
  const lineItems = Array.from({ length: itemCount }, (_, index) => ({
    id: flags.lineItemId?.[index],
    type: flags.lineItemType?.[index],
    name: flags.lineItemName?.[index],
    description: flags.lineItemDescription?.[index],
    quantity: flags.lineItemQuantity?.[index],
    unitName: flags.lineItemUnitName?.[index],
    unitPrice: invoiceUnitPriceFromFlags(flags, index),
    discountPercentage: flags.lineItemDiscountPercentage?.[index],
    lineItemAmount: flags.lineItemAmount?.[index],
  }))

  const paymentDiscountProvided =
    flags.paymentConditionsPaymentDiscountConditionsDiscountPercentage !== undefined ||
    flags.paymentConditionsPaymentDiscountConditionsDiscountRange !== undefined
  const paymentProvided =
    flags.paymentConditionsPaymentTermLabel !== undefined ||
    flags.paymentConditionsPaymentTermDuration !== undefined ||
    paymentDiscountProvided
  const addressProvided = [
    flags.addressContactId,
    flags.addressName,
    flags.addressSupplement,
    flags.addressStreet,
    flags.addressCity,
    flags.addressZip,
    flags.addressCountryCode,
  ].some((value) => value !== undefined)
  const totalPriceProvided = [
    flags.totalPriceCurrency,
    flags.totalPriceTotalNetAmount,
    flags.totalPriceTotalGrossAmount,
    flags.totalPriceTotalTaxAmount,
    flags.totalPriceTotalDiscountAbsolute,
    flags.totalPriceTotalDiscountPercentage,
  ].some((value) => value !== undefined)
  const taxConditionsProvided = [
    flags.taxConditionsTaxType,
    flags.taxConditionsTaxSubType,
    flags.taxConditionsTaxTypeNote,
  ].some((value) => value !== undefined)
  const shippingConditionsProvided = [
    flags.shippingConditionsShippingType,
    flags.shippingConditionsShippingDate,
    flags.shippingConditionsShippingEndDate,
  ].some((value) => value !== undefined)

  return {
    title: flags.title,
    introduction: flags.introduction,
    remark: flags.remark,
    voucherDate: flags.voucherDate,
    address: addressProvided
      ? {
          contactId: flags.addressContactId,
          name: flags.addressName,
          supplement: flags.addressSupplement,
          street: flags.addressStreet,
          city: flags.addressCity,
          zip: flags.addressZip,
          countryCode: flags.addressCountryCode,
        }
      : undefined,
    lineItems,
    totalPrice: totalPriceProvided
      ? {
          currency: flags.totalPriceCurrency,
          totalNetAmount: flags.totalPriceTotalNetAmount,
          totalGrossAmount: flags.totalPriceTotalGrossAmount,
          totalTaxAmount: flags.totalPriceTotalTaxAmount,
          totalDiscountAbsolute: flags.totalPriceTotalDiscountAbsolute,
          totalDiscountPercentage: flags.totalPriceTotalDiscountPercentage,
        }
      : undefined,
    taxConditions: taxConditionsProvided
      ? {
          taxType: flags.taxConditionsTaxType,
          taxSubType: flags.taxConditionsTaxSubType,
          taxTypeNote: flags.taxConditionsTaxTypeNote,
        }
      : undefined,
    shippingConditions: shippingConditionsProvided
      ? {
          shippingType: flags.shippingConditionsShippingType,
          shippingDate: flags.shippingConditionsShippingDate,
          shippingEndDate: flags.shippingConditionsShippingEndDate,
        }
      : undefined,
    paymentConditions: paymentProvided
      ? {
          paymentTermLabel: flags.paymentConditionsPaymentTermLabel,
          paymentTermDuration: flags.paymentConditionsPaymentTermDuration,
          paymentDiscountConditions: paymentDiscountProvided
            ? {
                discountPercentage: flags.paymentConditionsPaymentDiscountConditionsDiscountPercentage,
                discountRange: flags.paymentConditionsPaymentDiscountConditionsDiscountRange,
              }
            : undefined,
        }
      : undefined,
    xRechnung:
      flags.xRechnungBuyerReference === undefined ? undefined : { buyerReference: flags.xRechnungBuyerReference },
    version: flags.version,
  }
}

function invoiceCreateInputFromFlags(flags: InvoiceCreateInputFlags): unknown {
  return {
    invoice: invoiceBodyInputFromFlags(flags),
    precedingSalesVoucherId: flags.precedingSalesVoucherId,
    finalize: flags.finalize,
  }
}

export { invoiceBodyInputFromFlags, invoiceCreateInputFromFlags }
