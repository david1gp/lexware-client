import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import {
  lexwareClientCreate,
  voucherCreate,
  voucherFileUpload,
  voucherGet,
  voucherListList,
  voucherUpdate,
} from "../dist/index.js"
import { lexwareE2eFetchCreate } from "./lexwareE2eFetchCreate.js"
import { lexwareE2eResourceName } from "./lexwareE2eResourceName.js"
import { lexwareE2eResultAssert } from "./lexwareE2eResultAssert.js"

const noResourceId = "00000000-0000-0000-0000-000000000000"
const unavoidableLeftovers: string[] = []
let client: ReturnType<typeof lexwareE2eClientCreate>

beforeAll(() => {
  client = lexwareE2eClientCreate()
})

afterAll(() => {
  if (unavoidableLeftovers.length > 0) {
    console.info(
      `Live E2E unavoidable leftovers (the API exposes no voucher delete operation): ${unavoidableLeftovers.join(", ")}`,
    )
  }
})

describe("bookkeeping voucher live lifecycle", () => {
  test(
    "creates, gets, updates, gets again, and attaches a harmless tiny file",
    async () => {
      const name = lexwareE2eResourceName("bookkeeping voucher")
      const body = lexwareE2eVoucherBody(name)
      const createdResult = await voucherCreate(client, body)

      if (!expectLiveSuccessOr403("voucherCreate", createdResult)) {
        expectScopeBlocked("voucherGet", await voucherGet(client, noResourceId))
        expectScopeBlocked("voucherUpdate", await voucherUpdate(client, noResourceId, { ...body, version: 1 }))
        expectScopeBlocked("voucherFileUpload", await voucherFileUpload(client, noResourceId, lexwareE2eAttachment()))
        return
      }

      const created = lexwareE2eResultAssert("voucherCreate", createdResult)
      const voucherId = lexwareE2eResourceId(created)
      unavoidableLeftovers.push(`bookkeeping voucher ${name} (${voucherId})`)

      const fetchedResult = await voucherGet(client, voucherId)
      if (!expectLiveSuccessOr403("voucherGet", fetchedResult)) {
        expectScopeBlocked("voucherUpdate", await voucherUpdate(client, voucherId, body))
        expectScopeBlocked("voucherFileUpload", await voucherFileUpload(client, voucherId, lexwareE2eAttachment()))
        return
      }

      const fetched = lexwareE2eRecord(lexwareE2eResultAssert("voucherGet", fetchedResult))
      expect(fetched.id).toBe(voucherId)
      const updatedBody = {
        ...body,
        remark: `${name} updated`,
        version: lexwareE2eVersion(fetched),
      }
      const updatedResult = await voucherUpdate(client, voucherId, updatedBody)
      if (!expectLiveSuccessOr403("voucherUpdate", updatedResult)) {
        expectScopeBlocked("voucherFileUpload", await voucherFileUpload(client, voucherId, lexwareE2eAttachment()))
        return
      }

      const updatedFetchedResult = await voucherGet(client, voucherId)
      if (!expectLiveSuccessOr403("voucherGet after update", updatedFetchedResult)) {
        expectScopeBlocked("voucherFileUpload", await voucherFileUpload(client, voucherId, lexwareE2eAttachment()))
        return
      }
      const updatedFetched = lexwareE2eRecord(lexwareE2eResultAssert("voucherGet after update", updatedFetchedResult))
      expect(updatedFetched.id).toBe(voucherId)
      expect(updatedFetched.remark).toBe(updatedBody.remark)

      const uploadedResult = await voucherFileUpload(client, voucherId, lexwareE2eAttachment())
      if (!expectLiveSuccessOr403("voucherFileUpload", uploadedResult)) return

      const uploaded = lexwareE2eResultAssert("voucherFileUpload", uploadedResult)
      expect(uploaded.voucherId).toBe(voucherId)
      unavoidableLeftovers.push(`voucher attachment ${uploaded.id} (${voucherId})`)
    },
    { timeout: 120_000 },
  )
})

describe("voucherlist live filters", () => {
  test(
    "lists and exercises every official voucherlist query parameter in two practical requests",
    async () => {
      const firstResult = await voucherListList(client, {
        page: 0,
        size: 1,
        voucherType: "any",
        voucherStatus: "any",
      })
      const firstSucceeded = expectLiveSuccessOr403("voucherListList base", firstResult)
      const contactId = firstSucceeded ? (lexwareE2eFirstContactId(firstResult.data) ?? noResourceId) : noResourceId

      if (firstSucceeded) expect(lexwareE2eResultAssert("voucherListList base", firstResult)).not.toBeNull()

      const secondResult = await voucherListList(client, {
        page: 0,
        size: 1,
        voucherType: "purchaseinvoice,invoice",
        voucherStatus: "open",
        archived: false,
        contactId,
        voucherDateFrom: "2020-01-01",
        voucherDateTo: lexwareE2eDateOnly(),
        createdDateFrom: "2020-01-01",
        createdDateTo: lexwareE2eDateOnly(),
        updatedDateFrom: "2020-01-01",
        updatedDateTo: lexwareE2eDateOnly(),
        voucherNumber: "Davids-KI-E2E-TEST",
        sort: "voucherDate,DESC",
      })
      if (firstSucceeded) {
        expect(secondResult.success).toBe(true)
        expect(lexwareE2eResultAssert("voucherListList all filters", secondResult)).not.toBeNull()
        return
      }

      expectScopeBlocked("voucherListList all filters", secondResult)
    },
    { timeout: 60_000 },
  )
})

function lexwareE2eClientCreate() {
  const accessToken = Bun.env.LEXWARE_API_KEY?.trim()
  if (!accessToken) {
    throw new Error("LEXWARE_API_KEY is required for live E2E; add it to .env before running this test")
  }

  const queuedFetch = lexwareE2eFetchCreate()
  const tracedFetch: typeof queuedFetch = async (input, init) => {
    const response = await queuedFetch(input, init)
    const url = new URL(String(input))
    const endpoint = url.pathname.replace(/\/[0-9a-f-]{36}(?=\/|$)/gi, "/:id")
    console.info(`Live E2E endpoint outcome: ${init?.method ?? "GET"} ${endpoint} -> HTTP ${response.status}`)
    return response
  }
  const result = lexwareClientCreate({ accessToken, fetch: tracedFetch })
  if (!result.success) throw new Error("Unable to initialize the live Lexware E2E client")
  return result.data
}

function lexwareE2eVoucherBody(description: string) {
  return {
    type: "purchaseinvoice" as const,
    voucherStatus: "open" as const,
    voucherNumber: `E2E-${crypto.randomUUID().slice(0, 8)}`,
    voucherDate: lexwareE2eDateOnly(),
    dueDate: lexwareE2eDateOnly(),
    totalGrossAmount: 1.19,
    totalTaxAmount: 0.19,
    taxType: "gross" as const,
    useCollectiveContact: true,
    contactName: description,
    remark: description,
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

function lexwareE2eAttachment() {
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 10 10] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 0 >>
stream
endstream
endobj
trailer
<< /Root 1 0 R >>
%%EOF
`

  return {
    filename: "Davids-KI-E2E-TEST.pdf",
    contentType: "application/pdf" as const,
    data: new TextEncoder().encode(content),
  }
}

function lexwareE2eDateOnly(): string {
  return new Date().toISOString().slice(0, 10)
}

function lexwareE2eFirstContactId(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined
  const content = (value as { content?: unknown }).content
  if (!Array.isArray(content)) return undefined

  for (const entry of content) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) continue
    const contactId = (entry as { contactId?: unknown }).contactId
    if (typeof contactId === "string" && contactId.length > 0) return contactId
  }
  return undefined
}

function expectLiveSuccessOr403(operation: string, result: LiveResult): boolean {
  if (result.success) return true
  expect(result.statusCode).toBe(403)
  console.info(`Live E2E ${operation} explicit outcome: HTTP 403 (missing API scope)`)
  return false
}

function expectScopeBlocked(operation: string, result: LiveResult): void {
  expect(result.success).toBe(false)
  expect(result.statusCode).toBe(403)
  console.info(`Live E2E ${operation} explicit outcome: HTTP 403 (missing API scope)`)
}

function lexwareE2eRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Live E2E returned an unexpected resource response")
  }
  return value as Record<string, unknown>
}

function lexwareE2eResourceId(value: unknown): string {
  const record = lexwareE2eRecord(value)
  if (typeof record.id === "string" && record.id.length > 0) return record.id

  if (typeof record.resourceUri === "string") {
    const resourceId = new URL(record.resourceUri).pathname.split("/").at(-1)
    if (resourceId) return resourceId
  }

  throw new Error("Live E2E create response did not contain a resource id")
}

function lexwareE2eVersion(value: Record<string, unknown>): number {
  if (typeof value.version === "number" && Number.isInteger(value.version) && value.version >= 0) {
    return value.version
  }
  throw new Error("Live E2E voucher response did not contain a version")
}

type LiveResult = {
  success: boolean
  statusCode?: number
  data?: unknown
}
