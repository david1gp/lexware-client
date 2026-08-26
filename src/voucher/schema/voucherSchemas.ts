import * as a from "valibot"
import {
  lexwareIdSchema,
  lexwareNonNegativeIntegerSchema,
  lexwareNonNegativeNumberSchema,
  lexwarePercentageSchema,
} from "../../shared/lexwareSchemas.js"

const voucherTypeSchema = a.picklist(["salesinvoice", "salescreditnote", "purchaseinvoice", "purchasecreditnote"])
const voucherStatusSchema = a.picklist(["open", "unchecked"])
const voucherTaxTypeSchema = a.picklist(["net", "gross"])
const voucherDateSchema = a.pipe(a.string(), a.isoDate())

export const voucherItemSchema = a.object({
  amount: lexwareNonNegativeNumberSchema,
  taxAmount: lexwareNonNegativeNumberSchema,
  taxRatePercent: lexwarePercentageSchema,
  categoryId: a.pipe(a.string(), a.uuid()),
})

const voucherBodyEntries = {
  type: voucherTypeSchema,
  voucherStatus: a.optional(voucherStatusSchema),
  voucherNumber: a.optional(a.string()),
  voucherDate: a.optional(voucherDateSchema),
  shippingDate: a.optional(voucherDateSchema),
  dueDate: a.optional(voucherDateSchema),
  totalGrossAmount: a.optional(lexwareNonNegativeNumberSchema),
  totalTaxAmount: a.optional(lexwareNonNegativeNumberSchema),
  taxType: voucherTaxTypeSchema,
  useCollectiveContact: a.boolean(),
  contactName: a.optional(a.string()),
  contactId: a.optional(a.pipe(a.string(), a.uuid())),
  remark: a.optional(a.string()),
  voucherItems: a.optional(a.pipe(a.array(voucherItemSchema), a.minLength(1))),
  files: a.optional(a.array(lexwareIdSchema)),
  version: a.optional(lexwareNonNegativeIntegerSchema),
} as const

export const voucherBodySchema = a.looseObject(voucherBodyEntries)

const voucherRequiredBodySchema = a.pipe(
  voucherBodySchema,
  a.check(
    (input) =>
      input.voucherStatus === "unchecked" ||
      (input.voucherNumber !== undefined &&
        input.voucherDate !== undefined &&
        input.totalGrossAmount !== undefined &&
        input.totalTaxAmount !== undefined &&
        input.voucherItems !== undefined),
    "voucherNumber, voucherDate, totalGrossAmount, totalTaxAmount, and voucherItems are required unless voucherStatus is unchecked",
  ),
  a.check(
    (input) => input.useCollectiveContact || input.contactId !== undefined,
    "contactId is required when useCollectiveContact is false",
  ),
)

export const voucherCreateBodySchema = a.pipe(
  voucherRequiredBodySchema,
  a.check((input) => input.version === undefined || input.version === 1, "version must be 1 when provided on create"),
)

export const voucherCreateInputSchema = voucherCreateBodySchema

export const voucherUpdateBodySchema = a.pipe(
  voucherRequiredBodySchema,
  a.check((input) => input.version !== undefined, "version is required on update"),
)

export const voucherUpdateInputSchema = a.object({
  id: lexwareIdSchema,
  voucher: voucherUpdateBodySchema,
})

export const voucherListInputEntries = {
  page: a.number(),
  status: a.string(),
}

export const voucherListInputSchema = a.object({
  page: a.optional(voucherListInputEntries.page),
  status: a.optional(voucherListInputEntries.status),
})

export type VoucherBody = a.InferOutput<typeof voucherBodySchema>
export type VoucherCreateInput = a.InferOutput<typeof voucherCreateInputSchema>
export type VoucherItem = a.InferOutput<typeof voucherItemSchema>
export type VoucherListInput = a.InferOutput<typeof voucherListInputSchema>
export type VoucherUpdateInput = a.InferOutput<typeof voucherUpdateInputSchema>
