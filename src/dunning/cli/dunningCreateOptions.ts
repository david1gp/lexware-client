import type { FlagParametersForType } from "@stricli/core"
import * as a from "valibot"
import { cliOptionCreate } from "../../cli/cliOptionCreate.js"
import { cliOptionSchemas } from "../../cli/cliOptionSchemas.js"
import {
  dunningCurrencySchema,
  dunningExtraLineItemAmountSchema,
  dunningExtraLineItemDescriptionSchema,
  dunningExtraLineItemDiscountPercentageSchema,
  dunningExtraLineItemNameSchema,
  dunningExtraLineItemQuantitySchema,
  dunningExtraLineItemTypeSchema,
  dunningExtraLineItemUnitNameSchema,
  dunningExtraLineItemUnitPriceCurrencySchema,
  dunningExtraLineItemUnitPriceGrossAmountSchema,
  dunningExtraLineItemUnitPriceNetAmountSchema,
  dunningExtraLineItemUnitPriceTaxRatePercentageSchema,
  dunningFinalizeSchema,
  dunningPrecedingSalesVoucherIdSchema,
  dunningTitleSchema,
  dunningTotalNetAmountSchema,
  dunningVoucherDateSchema,
} from "../schema/dunningSchemas.js"
import type { DunningCreateInputFlags } from "./dunningCreateInput.js"

export const dunningCreateOptions = {
  precedingSalesVoucherId: cliOptionCreate(dunningPrecedingSalesVoucherIdSchema, "Preceding sales voucher ID"),
  finalize: cliOptionCreate(a.pipe(cliOptionSchemas.boolean, dunningFinalizeSchema), "Finalize dunning", {
    optional: true,
  }),
  title: cliOptionCreate(dunningTitleSchema, "Dunning title", { optional: true }),
  voucherDate: cliOptionCreate(a.pipe(a.string(), a.isoTimestamp(), dunningVoucherDateSchema), "Voucher date"),
  extraLineItemType: cliOptionCreate(dunningExtraLineItemTypeSchema, "Extra line-item type", {
    optional: true,
    variadic: true,
  }),
  extraLineItemName: cliOptionCreate(dunningExtraLineItemNameSchema, "Extra line-item name", {
    optional: true,
    variadic: true,
  }),
  extraLineItemDescription: cliOptionCreate(dunningExtraLineItemDescriptionSchema, "Extra line-item description", {
    optional: true,
    variadic: true,
  }),
  extraLineItemQuantity: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, dunningExtraLineItemQuantitySchema),
    "Extra line-item quantity",
    {
      optional: true,
      variadic: true,
    },
  ),
  extraLineItemUnitName: cliOptionCreate(dunningExtraLineItemUnitNameSchema, "Extra line-item unit name", {
    optional: true,
    variadic: true,
  }),
  extraLineItemUnitPriceCurrency: cliOptionCreate(
    dunningExtraLineItemUnitPriceCurrencySchema,
    "Extra line-item unit-price currency",
    {
      optional: true,
      variadic: true,
    },
  ),
  extraLineItemUnitPriceNetAmount: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, dunningExtraLineItemUnitPriceNetAmountSchema),
    "Extra line-item unit-price net amount",
    {
      optional: true,
      variadic: true,
    },
  ),
  extraLineItemUnitPriceGrossAmount: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, dunningExtraLineItemUnitPriceGrossAmountSchema),
    "Extra line-item unit-price gross amount",
    {
      optional: true,
      variadic: true,
    },
  ),
  extraLineItemUnitPriceTaxRatePercentage: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, dunningExtraLineItemUnitPriceTaxRatePercentageSchema),
    "Extra line-item unit-price tax rate",
    {
      optional: true,
      variadic: true,
    },
  ),
  extraLineItemDiscountPercentage: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, dunningExtraLineItemDiscountPercentageSchema),
    "Extra line-item discount percentage",
    {
      optional: true,
      variadic: true,
    },
  ),
  extraLineItemAmount: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, dunningExtraLineItemAmountSchema),
    "Extra line-item amount",
    {
      optional: true,
      variadic: true,
    },
  ),
  totalNetAmount: cliOptionCreate(a.pipe(cliOptionSchemas.number, dunningTotalNetAmountSchema), "Total net amount", {
    optional: true,
  }),
  currency: cliOptionCreate(dunningCurrencySchema, "Currency", { optional: true }),
} satisfies FlagParametersForType<DunningCreateInputFlags>
