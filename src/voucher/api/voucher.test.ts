import { expect, test } from "bun:test"
import { lexwareJsonResponse, lexwareRequestBodyJson, lexwareTestClient } from "../../shared/lexwareTestClient.test.js"
import { voucherCreate } from "./voucherCreate.js"
import { voucherFileUpload } from "./voucherFileUpload.js"
import { voucherGet } from "./voucherGet.js"
import { voucherUpdate } from "./voucherUpdate.js"

test("voucherCreate posts voucher", async () => {
  const { client, calls } = lexwareTestClient()
  await voucherCreate(client, voucherBody())
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/vouchers")
  expect(calls[0]?.init?.method).toBe("POST")
  expect(await lexwareRequestBodyJson(calls[0]!)).toEqual(voucherBody())
})

test("voucherGet uses the plural voucher path", async () => {
  const { client, calls } = lexwareTestClient()
  await voucherGet(client, "v1")
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/vouchers/v1")
  expect(calls[0]?.init?.method).toBe("GET")
})

test("voucherUpdate uses plural voucher path", async () => {
  const { client, calls } = lexwareTestClient()
  const body = { ...voucherBody(), version: 1 }
  await voucherUpdate(client, "v1", body)
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/vouchers/v1")
  expect(calls[0]?.init?.method).toBe("PUT")
  expect(await lexwareRequestBodyJson(calls[0]!)).toEqual(body)
})

test("voucherFileUpload posts a multipart file to the voucher files endpoint", async () => {
  const { client, calls } = lexwareTestClient([lexwareJsonResponse({ id: "file-1", voucherId: "voucher-1" })])
  const result = await voucherFileUpload(client, "voucher/id", {
    contentType: "application/pdf",
    data: new Blob(["pdf"]),
    filename: "receipt.pdf",
  })

  expect(result.success).toBe(true)
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/vouchers/voucher%2Fid/files")
  expect(calls[0]?.init?.method).toBe("POST")
  expect(calls[0]?.init?.body).toBeInstanceOf(FormData)
  expect(new Headers(calls[0]?.init?.headers).get("Content-Type")).toBe(null)
  const form = calls[0]?.init?.body as FormData
  expect(form.get("file")).toBeInstanceOf(Blob)
  expect((form.get("file") as File).name).toBe("receipt.pdf")
  expect((form.get("file") as File).type).toBe("application/pdf")
  if (result.success) expect(result.data).toEqual({ id: "file-1", voucherId: "voucher-1" })
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
