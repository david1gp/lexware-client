import type {
  DeliveryNoteAddress,
  DeliveryNoteCreateBody,
  DeliveryNoteCreateInput,
  DeliveryNoteLineItem,
  DeliveryNoteShippingConditions,
  DeliveryNoteTaxConditions,
  DeliveryNoteUnitPrice,
} from "../schema/deliveryNoteSchemas.js"

type DeliveryNoteCreateInputFlags = {
  readonly title?: DeliveryNoteCreateBody["title"]
  readonly introduction?: DeliveryNoteCreateBody["introduction"]
  readonly deliveryTerms?: DeliveryNoteCreateBody["deliveryTerms"]
  readonly remark?: DeliveryNoteCreateBody["remark"]
  readonly language?: DeliveryNoteCreateBody["language"]
  readonly printLayoutId?: DeliveryNoteCreateBody["printLayoutId"]
  readonly voucherDate: DeliveryNoteCreateBody["voucherDate"]
  readonly addressContactId?: DeliveryNoteAddress["contactId"]
  readonly addressName?: DeliveryNoteAddress["name"]
  readonly addressSupplement?: DeliveryNoteAddress["supplement"]
  readonly addressStreet?: DeliveryNoteAddress["street"]
  readonly addressCity?: DeliveryNoteAddress["city"]
  readonly addressZip?: DeliveryNoteAddress["zip"]
  readonly addressCountryCode?: DeliveryNoteAddress["countryCode"]
  readonly lineItemId?: NonNullable<DeliveryNoteLineItem["id"]>[]
  readonly lineItemType?: DeliveryNoteLineItem["type"][]
  readonly lineItemName?: DeliveryNoteLineItem["name"][]
  readonly lineItemDescription?: NonNullable<DeliveryNoteLineItem["description"]>[]
  readonly lineItemQuantity?: NonNullable<DeliveryNoteLineItem["quantity"]>[]
  readonly lineItemUnitName?: NonNullable<DeliveryNoteLineItem["unitName"]>[]
  readonly lineItemUnitPriceCurrency?: NonNullable<DeliveryNoteUnitPrice["currency"]>[]
  readonly lineItemUnitPriceNetAmount?: NonNullable<DeliveryNoteUnitPrice["netAmount"]>[]
  readonly lineItemUnitPriceGrossAmount?: NonNullable<DeliveryNoteUnitPrice["grossAmount"]>[]
  readonly lineItemUnitPriceTaxRatePercentage?: NonNullable<DeliveryNoteUnitPrice["taxRatePercentage"]>[]
  readonly taxConditionsTaxType?: DeliveryNoteTaxConditions["taxType"]
  readonly taxConditionsTaxSubType?: NonNullable<DeliveryNoteTaxConditions["taxSubType"]>
  readonly taxConditionsTaxTypeNote?: NonNullable<DeliveryNoteTaxConditions["taxTypeNote"]>
  readonly shippingConditionsShippingType?: DeliveryNoteShippingConditions["shippingType"]
  readonly shippingConditionsShippingDate?: NonNullable<DeliveryNoteShippingConditions["shippingDate"]>
  readonly shippingConditionsShippingEndDate?: NonNullable<DeliveryNoteShippingConditions["shippingEndDate"]>
  readonly precedingSalesVoucherId?: DeliveryNoteCreateInput["precedingSalesVoucherId"]
  readonly finalize?: DeliveryNoteCreateInput["finalize"]
}

export type { DeliveryNoteCreateInputFlags }

function deliveryNoteLineItemCount(flags: DeliveryNoteCreateInputFlags): number {
  return Math.max(
    ...[
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
    ]
      .filter((values) => values !== undefined)
      .map((values) => values?.length ?? 0),
    0,
  )
}

function deliveryNoteUnitPriceFromFlags(flags: DeliveryNoteCreateInputFlags, index: number): unknown {
  const provided = [
    flags.lineItemUnitPriceCurrency,
    flags.lineItemUnitPriceNetAmount,
    flags.lineItemUnitPriceGrossAmount,
    flags.lineItemUnitPriceTaxRatePercentage,
  ].some((values) => values !== undefined && values.length > 0)
  if (!provided) return undefined

  return {
    currency: flags.lineItemUnitPriceCurrency?.[index],
    netAmount: flags.lineItemUnitPriceNetAmount?.[index],
    grossAmount: flags.lineItemUnitPriceGrossAmount?.[index],
    taxRatePercentage: flags.lineItemUnitPriceTaxRatePercentage?.[index],
  }
}

export function deliveryNoteCreateInputFromFlags(flags: DeliveryNoteCreateInputFlags): unknown {
  return {
    deliveryNote: {
      title: flags.title,
      introduction: flags.introduction,
      deliveryTerms: flags.deliveryTerms,
      remark: flags.remark,
      language: flags.language,
      printLayoutId: flags.printLayoutId,
      voucherDate: flags.voucherDate,
      address: {
        contactId: flags.addressContactId,
        name: flags.addressName,
        supplement: flags.addressSupplement,
        street: flags.addressStreet,
        city: flags.addressCity,
        zip: flags.addressZip,
        countryCode: flags.addressCountryCode,
      },
      lineItems: Array.from({ length: deliveryNoteLineItemCount(flags) }, (_, index) => ({
        id: flags.lineItemId?.[index],
        type: flags.lineItemType?.[index],
        name: flags.lineItemName?.[index],
        description: flags.lineItemDescription?.[index],
        quantity: flags.lineItemQuantity?.[index],
        unitName: flags.lineItemUnitName?.[index],
        unitPrice: deliveryNoteUnitPriceFromFlags(flags, index),
      })),
      taxConditions: {
        taxType: flags.taxConditionsTaxType,
        taxSubType: flags.taxConditionsTaxSubType,
        taxTypeNote: flags.taxConditionsTaxTypeNote,
      },
      shippingConditions: {
        shippingType: flags.shippingConditionsShippingType,
        shippingDate: flags.shippingConditionsShippingDate,
        shippingEndDate: flags.shippingConditionsShippingEndDate,
      },
    },
    precedingSalesVoucherId: flags.precedingSalesVoucherId,
    finalize: flags.finalize,
  }
}
