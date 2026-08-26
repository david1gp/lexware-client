import type {
  CreditNoteAddress,
  CreditNoteCreateBody,
  CreditNoteCreateInput,
  CreditNoteLineItem,
  CreditNoteTaxConditions,
  CreditNoteTotalPrice,
  CreditNoteUnitPrice,
} from "../schema/creditNoteSchemas.js"

type CreditNoteCreateInputFlags = {
  readonly title?: CreditNoteCreateBody["title"]
  readonly introduction?: CreditNoteCreateBody["introduction"]
  readonly remark?: CreditNoteCreateBody["remark"]
  readonly printLayoutId?: CreditNoteCreateBody["printLayoutId"]
  readonly voucherDate: CreditNoteCreateBody["voucherDate"]
  readonly addressContactId?: CreditNoteAddress["contactId"]
  readonly addressName?: CreditNoteAddress["name"]
  readonly addressSupplement?: CreditNoteAddress["supplement"]
  readonly addressStreet?: CreditNoteAddress["street"]
  readonly addressCity?: CreditNoteAddress["city"]
  readonly addressZip?: CreditNoteAddress["zip"]
  readonly addressCountryCode?: CreditNoteAddress["countryCode"]
  readonly lineItemId?: NonNullable<CreditNoteLineItem["id"]>[]
  readonly lineItemType?: CreditNoteLineItem["type"][]
  readonly lineItemName?: CreditNoteLineItem["name"][]
  readonly lineItemDescription?: NonNullable<CreditNoteLineItem["description"]>[]
  readonly lineItemQuantity?: NonNullable<CreditNoteLineItem["quantity"]>[]
  readonly lineItemUnitName?: NonNullable<CreditNoteLineItem["unitName"]>[]
  readonly lineItemUnitPriceCurrency?: NonNullable<CreditNoteUnitPrice["currency"]>[]
  readonly lineItemUnitPriceNetAmount?: NonNullable<CreditNoteUnitPrice["netAmount"]>[]
  readonly lineItemUnitPriceGrossAmount?: NonNullable<CreditNoteUnitPrice["grossAmount"]>[]
  readonly lineItemUnitPriceTaxRatePercentage?: NonNullable<CreditNoteUnitPrice["taxRatePercentage"]>[]
  readonly lineItemDiscountPercentage?: NonNullable<CreditNoteLineItem["discountPercentage"]>[]
  readonly lineItemAmount?: NonNullable<CreditNoteLineItem["lineItemAmount"]>[]
  readonly totalPriceCurrency?: CreditNoteTotalPrice["currency"]
  readonly totalPriceTotalNetAmount?: NonNullable<CreditNoteTotalPrice["totalNetAmount"]>
  readonly totalPriceTotalGrossAmount?: NonNullable<CreditNoteTotalPrice["totalGrossAmount"]>
  readonly totalPriceTotalTaxAmount?: NonNullable<CreditNoteTotalPrice["totalTaxAmount"]>
  readonly totalPriceTotalDiscountAbsolute?: NonNullable<CreditNoteTotalPrice["totalDiscountAbsolute"]>
  readonly totalPriceTotalDiscountPercentage?: NonNullable<CreditNoteTotalPrice["totalDiscountPercentage"]>
  readonly taxConditionsTaxType?: CreditNoteTaxConditions["taxType"]
  readonly taxConditionsTaxSubType?: CreditNoteTaxConditions["taxSubType"]
  readonly taxConditionsTaxTypeNote?: CreditNoteTaxConditions["taxTypeNote"]
  readonly precedingSalesVoucherId?: CreditNoteCreateInput["precedingSalesVoucherId"]
  readonly finalize?: CreditNoteCreateInput["finalize"]
}

export type { CreditNoteCreateInputFlags }

function creditNoteLineItemCount(flags: CreditNoteCreateInputFlags): number {
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
      flags.lineItemDiscountPercentage,
      flags.lineItemAmount,
    ]
      .filter((values) => values !== undefined)
      .map((values) => values?.length ?? 0),
    0,
  )
}

function creditNoteUnitPriceFromFlags(flags: CreditNoteCreateInputFlags, index: number): unknown {
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

function creditNoteBodyInputFromFlags(flags: CreditNoteCreateInputFlags): unknown {
  return {
    title: flags.title,
    introduction: flags.introduction,
    remark: flags.remark,
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
    lineItems: Array.from({ length: creditNoteLineItemCount(flags) }, (_, index) => ({
      id: flags.lineItemId?.[index],
      type: flags.lineItemType?.[index],
      name: flags.lineItemName?.[index],
      description: flags.lineItemDescription?.[index],
      quantity: flags.lineItemQuantity?.[index],
      unitName: flags.lineItemUnitName?.[index],
      unitPrice: creditNoteUnitPriceFromFlags(flags, index),
      discountPercentage: flags.lineItemDiscountPercentage?.[index],
      lineItemAmount: flags.lineItemAmount?.[index],
    })),
    totalPrice: {
      currency: flags.totalPriceCurrency,
      totalNetAmount: flags.totalPriceTotalNetAmount,
      totalGrossAmount: flags.totalPriceTotalGrossAmount,
      totalTaxAmount: flags.totalPriceTotalTaxAmount,
      totalDiscountAbsolute: flags.totalPriceTotalDiscountAbsolute,
      totalDiscountPercentage: flags.totalPriceTotalDiscountPercentage,
    },
    taxConditions: {
      taxType: flags.taxConditionsTaxType,
      taxSubType: flags.taxConditionsTaxSubType,
      taxTypeNote: flags.taxConditionsTaxTypeNote,
    },
  }
}

export function creditNoteCreateInputFromFlags(flags: CreditNoteCreateInputFlags): unknown {
  return {
    creditNote: creditNoteBodyInputFromFlags(flags),
    precedingSalesVoucherId: flags.precedingSalesVoucherId,
    finalize: flags.finalize,
  }
}
