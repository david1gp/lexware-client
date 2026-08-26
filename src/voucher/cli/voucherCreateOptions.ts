import type { FlagParametersForType } from "@stricli/core"
import * as a from "valibot"
import { cliOptionCreate } from "../../cli/cliOptionCreate.js"
import { cliOptionSchemas } from "../../cli/cliOptionSchemas.js"
import {
  lexwareIdSchema,
  lexwareNonNegativeNumberSchema,
  lexwarePercentageSchema,
} from "../../shared/lexwareSchemas.js"
import { voucherBodySchema, voucherItemSchema } from "../schema/voucherSchemas.js"
import type { VoucherCreateInputFlags } from "./voucherCreateInput.js"

type VoucherUpdateInputFlags = VoucherCreateInputFlags & {
  readonly fileId?: string[]
  readonly version: NonNullable<VoucherCreateInputFlags["version"]>
}

const voucherOptions = {
  type: cliOptionCreate(voucherBodySchema.entries.type, "Voucher type"),
  voucherStatus: cliOptionCreate(a.unwrap(voucherBodySchema.entries.voucherStatus), "Voucher status", {
    optional: true,
  }),
  voucherNumber: cliOptionCreate(a.unwrap(voucherBodySchema.entries.voucherNumber), "Voucher number", {
    optional: true,
  }),
  voucherDate: cliOptionCreate(cliOptionSchemas.date, "Voucher date", { optional: true }),
  shippingDate: cliOptionCreate(cliOptionSchemas.date, "Shipping date", { optional: true }),
  dueDate: cliOptionCreate(cliOptionSchemas.date, "Due date", { optional: true }),
  totalGrossAmount: cliOptionCreate(cliOptionSchemas.number, "Total gross amount", { optional: true }),
  totalTaxAmount: cliOptionCreate(cliOptionSchemas.number, "Total tax amount", { optional: true }),
  taxType: cliOptionCreate(voucherBodySchema.entries.taxType, "Tax type"),
  useCollectiveContact: cliOptionCreate(
    a.pipe(cliOptionSchemas.boolean, voucherBodySchema.entries.useCollectiveContact),
    "Use collective contact",
  ),
  contactName: cliOptionCreate(a.unwrap(voucherBodySchema.entries.contactName), "Contact name", { optional: true }),
  contactId: cliOptionCreate(lexwareIdSchema, "Contact ID", { optional: true }),
  remark: cliOptionCreate(a.unwrap(voucherBodySchema.entries.remark), "Voucher remark", { optional: true }),
  voucherItemAmount: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, lexwareNonNegativeNumberSchema),
    "Voucher-item amount",
    {
      optional: true,
      variadic: true,
    },
  ),
  voucherItemTaxAmount: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, lexwareNonNegativeNumberSchema),
    "Voucher-item tax amount",
    {
      optional: true,
      variadic: true,
    },
  ),
  voucherItemTaxRatePercent: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, lexwarePercentageSchema),
    "Voucher-item tax rate",
    {
      optional: true,
      variadic: true,
    },
  ),
  voucherItemCategoryId: cliOptionCreate(voucherItemSchema.entries.categoryId, "Voucher-item category ID", {
    optional: true,
    variadic: true,
  }),
  version: cliOptionCreate(cliOptionSchemas.integer, "Voucher version", { optional: true }),
} satisfies FlagParametersForType<VoucherCreateInputFlags>

const voucherCreateOptions = voucherOptions
const voucherUpdateOptions = {
  ...voucherOptions,
  fileId: cliOptionCreate(lexwareIdSchema, "Existing voucher file ID to retain", {
    optional: true,
    variadic: true,
  }),
  version: cliOptionCreate(cliOptionSchemas.integer, "Voucher version"),
} satisfies FlagParametersForType<VoucherUpdateInputFlags>

export { voucherCreateOptions, voucherUpdateOptions }
