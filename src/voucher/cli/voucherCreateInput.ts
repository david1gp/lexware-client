import type { VoucherBody, VoucherItem } from "../schema/voucherSchemas.js"

type VoucherCreateInputFlags = {
  readonly type: VoucherBody["type"]
  readonly voucherStatus?: VoucherBody["voucherStatus"]
  readonly voucherNumber?: VoucherBody["voucherNumber"]
  readonly voucherDate?: VoucherBody["voucherDate"]
  readonly shippingDate?: VoucherBody["shippingDate"]
  readonly dueDate?: VoucherBody["dueDate"]
  readonly totalGrossAmount?: VoucherBody["totalGrossAmount"]
  readonly totalTaxAmount?: VoucherBody["totalTaxAmount"]
  readonly taxType: VoucherBody["taxType"]
  readonly useCollectiveContact: VoucherBody["useCollectiveContact"]
  readonly contactName?: VoucherBody["contactName"]
  readonly contactId?: VoucherBody["contactId"]
  readonly remark?: VoucherBody["remark"]
  readonly voucherItemAmount?: VoucherItem["amount"][]
  readonly voucherItemTaxAmount?: VoucherItem["taxAmount"][]
  readonly voucherItemTaxRatePercent?: VoucherItem["taxRatePercent"][]
  readonly voucherItemCategoryId?: VoucherItem["categoryId"][]
  readonly version?: VoucherBody["version"]
}

export type { VoucherCreateInputFlags }

type VoucherBodyInputFlags = VoucherCreateInputFlags & {
  readonly fileId?: string[]
}

function voucherItemCount(flags: VoucherCreateInputFlags): number {
  return Math.max(
    flags.voucherItemAmount?.length ?? 0,
    flags.voucherItemTaxAmount?.length ?? 0,
    flags.voucherItemTaxRatePercent?.length ?? 0,
    flags.voucherItemCategoryId?.length ?? 0,
  )
}

function voucherBodyInputFromFlags(flags: VoucherBodyInputFlags): unknown {
  const itemCount = voucherItemCount(flags)
  const voucherItems = Array.from({ length: itemCount }, (_, index) => ({
    amount: flags.voucherItemAmount?.[index],
    taxAmount: flags.voucherItemTaxAmount?.[index],
    taxRatePercent: flags.voucherItemTaxRatePercent?.[index],
    categoryId: flags.voucherItemCategoryId?.[index],
  }))

  return {
    type: flags.type,
    voucherStatus: flags.voucherStatus,
    voucherNumber: flags.voucherNumber,
    voucherDate: flags.voucherDate,
    shippingDate: flags.shippingDate,
    dueDate: flags.dueDate,
    totalGrossAmount: flags.totalGrossAmount,
    totalTaxAmount: flags.totalTaxAmount,
    taxType: flags.taxType,
    useCollectiveContact: flags.useCollectiveContact,
    contactName: flags.contactName,
    contactId: flags.contactId,
    remark: flags.remark,
    files: flags.fileId,
    voucherItems: itemCount === 0 ? undefined : voucherItems,
    version: flags.version,
  }
}

export { voucherBodyInputFromFlags }
