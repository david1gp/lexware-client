import type { DunningCreateInput, DunningExtraLineItem, DunningUnitPrice } from "../schema/dunningSchemas.js"

type DunningCreateInputFlags = {
  readonly precedingSalesVoucherId: DunningCreateInput["precedingSalesVoucherId"]
  readonly finalize?: DunningCreateInput["finalize"]
  readonly title?: DunningCreateInput["title"]
  readonly voucherDate: DunningCreateInput["voucherDate"]
  readonly extraLineItemType?: NonNullable<DunningExtraLineItem["type"]>[]
  readonly extraLineItemName?: NonNullable<DunningExtraLineItem["name"]>[]
  readonly extraLineItemDescription?: NonNullable<DunningExtraLineItem["description"]>[]
  readonly extraLineItemQuantity?: NonNullable<DunningExtraLineItem["quantity"]>[]
  readonly extraLineItemUnitName?: NonNullable<DunningExtraLineItem["unitName"]>[]
  readonly extraLineItemUnitPriceCurrency?: NonNullable<DunningUnitPrice["currency"]>[]
  readonly extraLineItemUnitPriceNetAmount?: NonNullable<DunningUnitPrice["netAmount"]>[]
  readonly extraLineItemUnitPriceGrossAmount?: NonNullable<DunningUnitPrice["grossAmount"]>[]
  readonly extraLineItemUnitPriceTaxRatePercentage?: NonNullable<DunningUnitPrice["taxRatePercentage"]>[]
  readonly extraLineItemDiscountPercentage?: NonNullable<DunningExtraLineItem["discountPercentage"]>[]
  readonly extraLineItemAmount?: NonNullable<DunningExtraLineItem["lineItemAmount"]>[]
  readonly totalNetAmount?: DunningCreateInput["totalNetAmount"]
  readonly currency?: DunningCreateInput["currency"]
}

export type { DunningCreateInputFlags }

function dunningExtraLineItemFlagArrays(flags: DunningCreateInputFlags): readonly (readonly unknown[])[] {
  return [
    flags.extraLineItemType,
    flags.extraLineItemName,
    flags.extraLineItemDescription,
    flags.extraLineItemQuantity,
    flags.extraLineItemUnitName,
    flags.extraLineItemUnitPriceCurrency,
    flags.extraLineItemUnitPriceNetAmount,
    flags.extraLineItemUnitPriceGrossAmount,
    flags.extraLineItemUnitPriceTaxRatePercentage,
    flags.extraLineItemDiscountPercentage,
    flags.extraLineItemAmount,
  ].filter((value): value is string[] | number[] => value !== undefined && value.length > 0)
}

function dunningExtraLineItemFromFlags(flags: DunningCreateInputFlags, index: number): unknown {
  const unitPriceProvided = [
    flags.extraLineItemUnitPriceCurrency,
    flags.extraLineItemUnitPriceNetAmount,
    flags.extraLineItemUnitPriceGrossAmount,
    flags.extraLineItemUnitPriceTaxRatePercentage,
  ].some((values) => values !== undefined && values.length > 0)

  return {
    type: flags.extraLineItemType?.[index],
    name: flags.extraLineItemName?.[index],
    description: flags.extraLineItemDescription?.[index],
    quantity: flags.extraLineItemQuantity?.[index],
    unitName: flags.extraLineItemUnitName?.[index],
    unitPrice: unitPriceProvided
      ? {
          currency: flags.extraLineItemUnitPriceCurrency?.[index],
          netAmount: flags.extraLineItemUnitPriceNetAmount?.[index],
          grossAmount: flags.extraLineItemUnitPriceGrossAmount?.[index],
          taxRatePercentage: flags.extraLineItemUnitPriceTaxRatePercentage?.[index],
        }
      : undefined,
    discountPercentage: flags.extraLineItemDiscountPercentage?.[index],
    lineItemAmount: flags.extraLineItemAmount?.[index],
  }
}

export function dunningCreateInputFromFlags(flags: DunningCreateInputFlags): unknown {
  const arrays = dunningExtraLineItemFlagArrays(flags)
  const itemCount = arrays[0]?.length ?? 0
  const arraysHaveMatchingCardinality = arrays.every((values) => values.length === itemCount)

  return {
    precedingSalesVoucherId: flags.precedingSalesVoucherId,
    finalize: flags.finalize,
    title: flags.title,
    voucherDate: flags.voucherDate,
    extraLineItems:
      itemCount === 0
        ? undefined
        : Array.from({ length: arraysHaveMatchingCardinality ? itemCount : 0 }, (_, index) =>
            dunningExtraLineItemFromFlags(flags, index),
          ),
    totalNetAmount: flags.totalNetAmount,
    currency: flags.currency,
  }
}
