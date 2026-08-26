import type {
  QuotationAddress,
  QuotationCreateInput,
  QuotationLineItem,
  QuotationPaymentConditions,
  QuotationSubItem,
  QuotationTaxConditions,
  QuotationTotalPrice,
  QuotationUnitPrice,
} from "../schema/quotationSchemas.js"

type QuotationPaymentDiscountConditions = NonNullable<QuotationPaymentConditions["paymentDiscountConditions"]>

type QuotationCreateInputFlags = {
  readonly title?: QuotationCreateInput["title"]
  readonly introduction?: QuotationCreateInput["introduction"]
  readonly remark?: QuotationCreateInput["remark"]
  readonly language?: QuotationCreateInput["language"]
  readonly printLayoutId?: QuotationCreateInput["printLayoutId"]
  readonly voucherDate: QuotationCreateInput["voucherDate"]
  readonly expirationDate: QuotationCreateInput["expirationDate"]
  readonly addressContactId?: QuotationAddress["contactId"]
  readonly addressName?: QuotationAddress["name"]
  readonly addressSupplement?: QuotationAddress["supplement"]
  readonly addressStreet?: QuotationAddress["street"]
  readonly addressCity?: QuotationAddress["city"]
  readonly addressZip?: QuotationAddress["zip"]
  readonly addressCountryCode?: QuotationAddress["countryCode"]
  readonly lineItemId?: NonNullable<QuotationLineItem["id"]>[]
  readonly lineItemType?: QuotationLineItem["type"][]
  readonly lineItemName?: QuotationLineItem["name"][]
  readonly lineItemDescription?: NonNullable<QuotationLineItem["description"]>[]
  readonly lineItemQuantity?: NonNullable<QuotationLineItem["quantity"]>[]
  readonly lineItemUnitName?: NonNullable<QuotationLineItem["unitName"]>[]
  readonly lineItemUnitPriceCurrency?: NonNullable<QuotationUnitPrice["currency"]>[]
  readonly lineItemUnitPriceNetAmount?: NonNullable<QuotationUnitPrice["netAmount"]>[]
  readonly lineItemUnitPriceGrossAmount?: NonNullable<QuotationUnitPrice["grossAmount"]>[]
  readonly lineItemUnitPriceTaxRatePercentage?: NonNullable<QuotationUnitPrice["taxRatePercentage"]>[]
  readonly lineItemDiscountPercentage?: NonNullable<QuotationLineItem["discountPercentage"]>[]
  readonly lineItemAmount?: NonNullable<QuotationLineItem["lineItemAmount"]>[]
  readonly lineItemOptional?: NonNullable<QuotationLineItem["optional"]>[]
  readonly lineItemAlternative?: NonNullable<QuotationLineItem["alternative"]>[]
  readonly lineItemSubItemParentIndex?: number[]
  readonly lineItemSubItemId?: NonNullable<QuotationSubItem["id"]>[]
  readonly lineItemSubItemType?: QuotationSubItem["type"][]
  readonly lineItemSubItemName?: QuotationSubItem["name"][]
  readonly lineItemSubItemDescription?: NonNullable<QuotationSubItem["description"]>[]
  readonly lineItemSubItemQuantity?: NonNullable<QuotationSubItem["quantity"]>[]
  readonly lineItemSubItemUnitName?: NonNullable<QuotationSubItem["unitName"]>[]
  readonly lineItemSubItemUnitPriceCurrency?: NonNullable<QuotationUnitPrice["currency"]>[]
  readonly lineItemSubItemUnitPriceNetAmount?: NonNullable<QuotationUnitPrice["netAmount"]>[]
  readonly lineItemSubItemUnitPriceGrossAmount?: NonNullable<QuotationUnitPrice["grossAmount"]>[]
  readonly lineItemSubItemUnitPriceTaxRatePercentage?: NonNullable<QuotationUnitPrice["taxRatePercentage"]>[]
  readonly lineItemSubItemDiscountPercentage?: NonNullable<QuotationSubItem["discountPercentage"]>[]
  readonly lineItemSubItemAmount?: NonNullable<QuotationSubItem["lineItemAmount"]>[]
  readonly lineItemSubItemAlternative?: boolean[]
  readonly totalPriceCurrency?: QuotationTotalPrice["currency"]
  readonly totalPriceTotalNetAmount?: NonNullable<QuotationTotalPrice["totalNetAmount"]>
  readonly totalPriceTotalGrossAmount?: NonNullable<QuotationTotalPrice["totalGrossAmount"]>
  readonly totalPriceTotalTaxAmount?: NonNullable<QuotationTotalPrice["totalTaxAmount"]>
  readonly totalPriceTotalDiscountAbsolute?: NonNullable<QuotationTotalPrice["totalDiscountAbsolute"]>
  readonly totalPriceTotalDiscountPercentage?: NonNullable<QuotationTotalPrice["totalDiscountPercentage"]>
  readonly taxConditionsTaxType?: QuotationTaxConditions["taxType"]
  readonly taxConditionsTaxSubType?: QuotationTaxConditions["taxSubType"]
  readonly taxConditionsTaxTypeNote?: QuotationTaxConditions["taxTypeNote"]
  readonly paymentConditionsPaymentTermLabel?: QuotationPaymentConditions["paymentTermLabel"]
  readonly paymentConditionsPaymentTermDuration?: NonNullable<QuotationPaymentConditions["paymentTermDuration"]>
  readonly paymentConditionsPaymentDiscountConditionsDiscountPercentage?: NonNullable<
    QuotationPaymentDiscountConditions["discountPercentage"]
  >
  readonly paymentConditionsPaymentDiscountConditionsDiscountRange?: NonNullable<
    QuotationPaymentDiscountConditions["discountRange"]
  >
}

export type { QuotationCreateInputFlags }

function quotationLineItemFlagArrays(flags: QuotationCreateInputFlags): readonly (readonly unknown[])[] {
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
    flags.lineItemOptional,
    flags.lineItemAlternative,
  ].filter((value): value is string[] | number[] | boolean[] => value !== undefined && value.length > 0)
}

function quotationSubItemFlagArrays(flags: QuotationCreateInputFlags): readonly (readonly unknown[])[] {
  return [
    flags.lineItemSubItemParentIndex,
    flags.lineItemSubItemId,
    flags.lineItemSubItemType,
    flags.lineItemSubItemName,
    flags.lineItemSubItemDescription,
    flags.lineItemSubItemQuantity,
    flags.lineItemSubItemUnitName,
    flags.lineItemSubItemUnitPriceCurrency,
    flags.lineItemSubItemUnitPriceNetAmount,
    flags.lineItemSubItemUnitPriceGrossAmount,
    flags.lineItemSubItemUnitPriceTaxRatePercentage,
    flags.lineItemSubItemDiscountPercentage,
    flags.lineItemSubItemAmount,
    flags.lineItemSubItemAlternative,
  ].filter((value): value is string[] | number[] | boolean[] => value !== undefined && value.length > 0)
}

function quotationUnitPriceFromFlags(
  currency: "EUR"[] | undefined,
  netAmount: number[] | undefined,
  grossAmount: number[] | undefined,
  taxRatePercentage: number[] | undefined,
  index: number,
): unknown {
  const unitPriceProvided = [currency, netAmount, grossAmount, taxRatePercentage].some(
    (values) => values !== undefined && values.length > 0,
  )

  if (!unitPriceProvided) return undefined

  return {
    currency: currency?.[index],
    netAmount: netAmount?.[index],
    grossAmount: grossAmount?.[index],
    taxRatePercentage: taxRatePercentage?.[index],
  }
}

function quotationSubItemFromFlags(flags: QuotationCreateInputFlags, index: number): unknown {
  return {
    id: flags.lineItemSubItemId?.[index],
    type: flags.lineItemSubItemType?.[index],
    name: flags.lineItemSubItemName?.[index],
    description: flags.lineItemSubItemDescription?.[index],
    quantity: flags.lineItemSubItemQuantity?.[index],
    unitName: flags.lineItemSubItemUnitName?.[index],
    unitPrice: quotationUnitPriceFromFlags(
      flags.lineItemSubItemUnitPriceCurrency,
      flags.lineItemSubItemUnitPriceNetAmount,
      flags.lineItemSubItemUnitPriceGrossAmount,
      flags.lineItemSubItemUnitPriceTaxRatePercentage,
      index,
    ),
    discountPercentage: flags.lineItemSubItemDiscountPercentage?.[index],
    lineItemAmount: flags.lineItemSubItemAmount?.[index],
    alternative: flags.lineItemSubItemAlternative?.[index] ?? true,
  }
}

function quotationBodyInputFromFlags(flags: QuotationCreateInputFlags): unknown {
  const lineItemArrays = quotationLineItemFlagArrays(flags)
  const itemCount = lineItemArrays[0]?.length ?? 0
  const lineItemsHaveMatchingCardinality = lineItemArrays.every((values) => values.length === itemCount)
  const subItemsByParent = Array.from({ length: itemCount }, () => [] as unknown[])
  const subItemArrays = quotationSubItemFlagArrays(flags)
  const subItemCount = subItemArrays[0]?.length ?? 0
  const subItemsHaveMatchingCardinality = subItemArrays.every((values) => values.length === subItemCount)
  const parentIndexes = flags.lineItemSubItemParentIndex ?? []
  const subItemsHaveValidParents = parentIndexes.every((parentIndex) => parentIndex >= 0 && parentIndex < itemCount)
  const lineItemsAreAssembled =
    lineItemsHaveMatchingCardinality && subItemsHaveMatchingCardinality && subItemsHaveValidParents

  for (let index = 0; index < subItemCount; index += 1) {
    const parentIndex = parentIndexes[index]
    if (parentIndex === undefined || parentIndex < 0 || parentIndex >= itemCount) continue
    subItemsByParent[parentIndex]?.push(quotationSubItemFromFlags(flags, index))
  }

  const lineItems = Array.from({ length: lineItemsAreAssembled ? itemCount : 0 }, (_, index) => {
    const subItems = subItemsByParent[index]
    return {
      id: flags.lineItemId?.[index],
      type: flags.lineItemType?.[index],
      name: flags.lineItemName?.[index],
      description: flags.lineItemDescription?.[index],
      quantity: flags.lineItemQuantity?.[index],
      unitName: flags.lineItemUnitName?.[index],
      unitPrice: quotationUnitPriceFromFlags(
        flags.lineItemUnitPriceCurrency,
        flags.lineItemUnitPriceNetAmount,
        flags.lineItemUnitPriceGrossAmount,
        flags.lineItemUnitPriceTaxRatePercentage,
        index,
      ),
      discountPercentage: flags.lineItemDiscountPercentage?.[index],
      lineItemAmount: flags.lineItemAmount?.[index],
      subItems: subItems === undefined || subItems.length === 0 ? undefined : subItems,
      optional: flags.lineItemOptional?.[index],
      alternative: flags.lineItemAlternative?.[index],
    }
  })

  const paymentDiscountProvided =
    flags.paymentConditionsPaymentDiscountConditionsDiscountPercentage !== undefined ||
    flags.paymentConditionsPaymentDiscountConditionsDiscountRange !== undefined
  const paymentProvided =
    flags.paymentConditionsPaymentTermLabel !== undefined ||
    flags.paymentConditionsPaymentTermDuration !== undefined ||
    paymentDiscountProvided

  return {
    title: flags.title,
    introduction: flags.introduction,
    remark: flags.remark,
    language: flags.language,
    printLayoutId: flags.printLayoutId,
    voucherDate: flags.voucherDate,
    expirationDate: flags.expirationDate,
    address: {
      contactId: flags.addressContactId,
      name: flags.addressName,
      supplement: flags.addressSupplement,
      street: flags.addressStreet,
      city: flags.addressCity,
      zip: flags.addressZip,
      countryCode: flags.addressCountryCode,
    },
    lineItems,
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
  }
}

export { quotationBodyInputFromFlags }
