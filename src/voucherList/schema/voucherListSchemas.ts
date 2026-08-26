import * as a from "valibot"
import { lexwareNonNegativeIntegerSchema } from "../../shared/lexwareSchemas.js"

const voucherListVoucherTypeValues = [
  "salesinvoice",
  "salescreditnote",
  "purchaseinvoice",
  "purchasecreditnote",
  "invoice",
  "downpaymentinvoice",
  "creditnote",
  "orderconfirmation",
  "quotation",
  "deliverynote",
] as const

const voucherListVoucherStatusValues = [
  "draft",
  "open",
  "paid",
  "paidoff",
  "voided",
  "transferred",
  "sepadebit",
  "overdue",
  "accepted",
  "rejected",
  "unchecked",
] as const

function voucherListCommaSeparatedValueSchema<TValue extends string>(
  values: readonly TValue[],
  additionalCheck?: (value: string[]) => boolean,
) {
  return a.pipe(
    a.string(),
    a.minLength(1),
    a.check((input) => {
      const entries = input.split(",")
      if (entries.some((entry) => !values.includes(entry as TValue))) return false
      if (new Set(entries).size !== entries.length) return false
      return additionalCheck?.(entries) ?? true
    }, "Expected a comma-separated list of supported values"),
  )
}

const voucherListVoucherTypeSchema = voucherListCommaSeparatedValueSchema(
  [...voucherListVoucherTypeValues, "any"],
  (entries) => entries.length === 1 || !entries.includes("any"),
)

const voucherListVoucherStatusSchema = voucherListCommaSeparatedValueSchema(
  [...voucherListVoucherStatusValues, "any"],
  (entries) =>
    (entries.length === 1 || !entries.includes("any")) && (!entries.includes("overdue") || entries.length === 1),
)

const voucherListDateSchema = a.pipe(a.string(), a.isoDate())

const voucherListSortSchema = a.picklist([
  "voucherDate",
  "voucherDate,ASC",
  "voucherDate,DESC",
  "voucherNumber",
  "voucherNumber,ASC",
  "voucherNumber,DESC",
  "createdDate",
  "createdDate,ASC",
  "createdDate,DESC",
  "updatedDate",
  "updatedDate,ASC",
  "updatedDate,DESC",
])

export const voucherListListInputEntries = {
  page: lexwareNonNegativeIntegerSchema,
  size: a.pipe(lexwareNonNegativeIntegerSchema, a.minValue(1), a.maxValue(250)),
  voucherType: voucherListVoucherTypeSchema,
  voucherStatus: voucherListVoucherStatusSchema,
  archived: a.boolean(),
  contactId: a.pipe(a.string(), a.uuid()),
  voucherDateFrom: voucherListDateSchema,
  voucherDateTo: voucherListDateSchema,
  createdDateFrom: voucherListDateSchema,
  createdDateTo: voucherListDateSchema,
  updatedDateFrom: voucherListDateSchema,
  updatedDateTo: voucherListDateSchema,
  voucherNumber: a.string(),
  sort: voucherListSortSchema,
}

export const voucherListListInputSchema = a.object({
  page: a.optional(voucherListListInputEntries.page),
  size: a.optional(voucherListListInputEntries.size),
  voucherType: voucherListListInputEntries.voucherType,
  voucherStatus: voucherListListInputEntries.voucherStatus,
  archived: a.optional(voucherListListInputEntries.archived),
  contactId: a.optional(voucherListListInputEntries.contactId),
  voucherDateFrom: a.optional(voucherListListInputEntries.voucherDateFrom),
  voucherDateTo: a.optional(voucherListListInputEntries.voucherDateTo),
  createdDateFrom: a.optional(voucherListListInputEntries.createdDateFrom),
  createdDateTo: a.optional(voucherListListInputEntries.createdDateTo),
  updatedDateFrom: a.optional(voucherListListInputEntries.updatedDateFrom),
  updatedDateTo: a.optional(voucherListListInputEntries.updatedDateTo),
  voucherNumber: a.optional(voucherListListInputEntries.voucherNumber),
  sort: a.optional(voucherListListInputEntries.sort),
})

export type VoucherListListInput = a.InferOutput<typeof voucherListListInputSchema>
