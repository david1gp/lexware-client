import { expect, test } from "bun:test"
import * as a from "valibot"
import { voucherFileUploadInputSchema } from "./voucherFileUploadInputSchema.js"
import { voucherFileUploadResponseSchema } from "./voucherFileUploadResponseSchema.js"
import {
  voucherBodySchema,
  voucherCreateInputSchema,
  voucherItemSchema,
  voucherListInputSchema,
  voucherUpdateInputSchema,
} from "./voucherSchemas.js"

test("voucher body schema validates official bookkeeping voucher fields", () => {
  const parsed = a.safeParse(voucherBodySchema, voucherBody())

  expect(parsed.success).toBe(true)
})

test("voucher domain schemas reject invalid nested values", () => {
  expect(a.safeParse(voucherItemSchema, { amount: 1, taxAmount: 0.19, taxRatePercent: 19 }).success).toBe(false)
  expect(
    a.safeParse(voucherItemSchema, {
      amount: -1,
      taxAmount: 0.19,
      taxRatePercent: 19,
      categoryId: "cf03a2b0-f838-474f-ac5e-67adb9b830c7",
    }).success,
  ).toBe(false)
  expect(
    a.safeParse(voucherItemSchema, {
      amount: 1,
      taxAmount: 0.19,
      taxRatePercent: 101,
      categoryId: "cf03a2b0-f838-474f-ac5e-67adb9b830c7",
    }).success,
  ).toBe(false)
  expect(
    a.safeParse(voucherBodySchema, {
      ...voucherBody(),
      voucherDate: "not-a-date",
    }).success,
  ).toBe(false)
  expect(a.safeParse(voucherBodySchema, { ...voucherBody(), totalGrossAmount: -1 }).success).toBe(false)
  expect(a.safeParse(voucherBodySchema, { ...voucherBody(), totalTaxAmount: -1 }).success).toBe(false)
})

test("voucher create validation requires official bookkeeping fields", () => {
  expect(a.safeParse(voucherCreateInputSchema, voucherBody()).success).toBe(true)
  expect(a.safeParse(voucherCreateInputSchema, { ...voucherBody(), type: "invoice" }).success).toBe(false)
  expect(a.safeParse(voucherCreateInputSchema, { ...voucherBody(), taxType: "vatfree" }).success).toBe(false)
  expect(a.safeParse(voucherCreateInputSchema, { ...voucherBody(), version: 0 }).success).toBe(false)
  expect(a.safeParse(voucherCreateInputSchema, { ...voucherBody(), useCollectiveContact: false }).success).toBe(false)
  expect(
    a.safeParse(voucherCreateInputSchema, {
      type: "purchaseinvoice",
      voucherStatus: "unchecked",
      taxType: "gross",
      useCollectiveContact: false,
      contactId: "777c7793-9fbb-4ec7-9254-0619c199761e",
    }).success,
  ).toBe(true)
})

test("voucher final schemas cover create, update, and list inputs", () => {
  const body = voucherBody()

  expect(a.safeParse(voucherCreateInputSchema, body).success).toBe(true)
  expect(a.safeParse(voucherUpdateInputSchema, { id: "voucher-1", voucher: { ...body, version: 1 } }).success).toBe(
    true,
  )
  expect(a.safeParse(voucherUpdateInputSchema, { id: "voucher-1", voucher: body }).success).toBe(false)
  expect(a.safeParse(voucherListInputSchema, { page: 2, status: "open" }).success).toBe(true)
})

test("voucher file upload schemas cover the official multipart request and response", () => {
  expect(
    a.safeParse(voucherFileUploadInputSchema, {
      contentType: "application/pdf",
      data: new Blob(["pdf"]),
      filename: "receipt.pdf",
    }).success,
  ).toBe(true)
  expect(a.safeParse(voucherFileUploadResponseSchema, { id: "file-1", voucherId: "voucher-1" }).success).toBe(true)
})

function voucherBody() {
  return {
    type: "purchaseinvoice" as const,
    voucherStatus: "open" as const,
    voucherNumber: "Davids-KI-E2E-TEST-1",
    voucherDate: "2026-08-26",
    dueDate: "2026-08-26",
    totalGrossAmount: 1.19,
    totalTaxAmount: 0.19,
    taxType: "gross" as const,
    useCollectiveContact: true,
    contactName: "Davids-KI-E2E-TEST",
    remark: "Davids-KI-E2E-TEST",
    voucherItems: [
      {
        amount: 1.19,
        taxAmount: 0.19,
        taxRatePercent: 19,
        categoryId: "cf03a2b0-f838-474f-ac5e-67adb9b830c7",
      },
    ],
  }
}
