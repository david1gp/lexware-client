import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import {
  creditNoteCreate,
  creditNoteGet,
  creditNotePdfDownload,
  creditNoteXmlDownload,
  dunningCreate,
  dunningGet,
  dunningPdfDownload,
  invoiceCreate,
  lexwareClientCreate,
} from "../dist/index.js"
import { lexwareE2eCleanup } from "./lexwareE2eCleanup.js"
import { lexwareE2eFetchCreate } from "./lexwareE2eFetchCreate.js"
import { lexwareE2eResourceName } from "./lexwareE2eResourceName.js"
import { lexwareE2eResultAssert } from "./lexwareE2eResultAssert.js"

const cleanup = lexwareE2eCleanup()
const unavoidableLeftovers: string[] = []
const noResourceId = "00000000-0000-0000-0000-000000000000"
let client: ReturnType<typeof lexwareE2eClientCreate>
let precedingInvoiceId: string | undefined

beforeAll(async () => {
  client = lexwareE2eClientCreate()

  const name = lexwareE2eResourceName("preceding-invoice")
  const result = await invoiceCreate(client, {
    invoice: lexwareE2eInvoiceBody(name),
    finalize: true,
  })
  if (lexwareE2eScopeBlocked("invoiceCreate prerequisite", result)) return

  const created = lexwareE2eResultAssert("invoiceCreate prerequisite", result)
  precedingInvoiceId = lexwareE2eResourceId(created)
  unavoidableLeftovers.push(`invoice ${name} (${precedingInvoiceId})`)
})

afterAll(async () => {
  try {
    await cleanup.run()
  } finally {
    if (unavoidableLeftovers.length > 0) {
      console.info(
        `Live E2E unavoidable leftovers (the API exposes no delete operation): ${unavoidableLeftovers.join(", ")}`,
      )
    }
  }
})

describe("credit-note live lifecycle", () => {
  test(
    "creates a draft from a prefixed invoice when permitted, gets it, and exercises PDF/XML downloads",
    async () => {
      const name = lexwareE2eResourceName("credit-note")
      const result = await creditNoteCreate(client, {
        creditNote: lexwareE2eCreditNoteBody(name),
        ...(precedingInvoiceId === undefined ? {} : { precedingSalesVoucherId: precedingInvoiceId }),
        finalize: false,
      })

      if (lexwareE2eScopeBlocked("creditNoteCreate", result)) {
        const readId = precedingInvoiceId ?? noResourceId
        expect(lexwareE2eScopeBlocked("creditNoteGet", await creditNoteGet(client, readId))).toBe(true)
        expect(lexwareE2eScopeBlocked("creditNotePdfDownload", await creditNotePdfDownload(client, readId))).toBe(true)
        expect(lexwareE2eScopeBlocked("creditNoteXmlDownload", await creditNoteXmlDownload(client, readId))).toBe(true)
        return
      }

      const created = lexwareE2eResultAssert("creditNoteCreate", result)
      const creditNoteId = lexwareE2eResourceId(created)
      unavoidableLeftovers.push(`credit note ${name} (${creditNoteId})`)

      const fetched = await creditNoteGet(client, creditNoteId)
      if (!lexwareE2eScopeBlocked("creditNoteGet", fetched)) {
        expect(lexwareE2eRecord(lexwareE2eResultAssert("creditNoteGet", fetched)).id).toBe(creditNoteId)
      }

      lexwareE2eFileAssert(
        "creditNotePdfDownload",
        await lexwareE2eDownloadRetry("creditNotePdfDownload", () => creditNotePdfDownload(client, creditNoteId)),
        "application/pdf",
      )
      lexwareE2eFileAssert(
        "creditNoteXmlDownload",
        await lexwareE2eDownloadRetry("creditNoteXmlDownload", () => creditNoteXmlDownload(client, creditNoteId)),
        "application/xml",
      )
    },
    { timeout: 120_000 },
  )
})

describe("dunning live lifecycle", () => {
  test(
    "pursues a prefixed overdue invoice, gets the dunning, and downloads its PDF",
    async () => {
      const invoiceId = precedingInvoiceId ?? noResourceId
      const result = await dunningCreate(client, {
        precedingSalesVoucherId: invoiceId,
        finalize: true,
        title: "Davids-KI-E2E-TEST",
        voucherDate: new Date().toISOString(),
        totalNetAmount: 1,
        currency: "EUR",
      })

      if (lexwareE2eScopeBlocked("dunningCreate", result)) {
        expect(lexwareE2eScopeBlocked("dunningGet", await dunningGet(client, invoiceId))).toBe(true)
        expect(lexwareE2eScopeBlocked("dunningPdfDownload", await dunningPdfDownload(client, invoiceId))).toBe(true)
        return
      }

      const created = lexwareE2eResultAssert("dunningCreate", result)
      const dunningId = lexwareE2eResourceId(created)
      unavoidableLeftovers.push(`dunning (${dunningId})`)

      const fetched = lexwareE2eResultAssert("dunningGet", await dunningGet(client, dunningId))
      expect(lexwareE2eRecord(fetched).id).toBe(dunningId)

      lexwareE2eFileAssert(
        "dunningPdfDownload",
        await lexwareE2eDownloadRetry("dunningPdfDownload", () => dunningPdfDownload(client, dunningId)),
        "application/pdf",
      )
    },
    { timeout: 120_000 },
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

function lexwareE2eInvoiceBody(name: string) {
  return {
    title: "Davids-KI-E2E-TEST",
    voucherDate: lexwareE2eDateTime(-45),
    address: {
      name,
      street: "Davids-KI-E2E-TEST Street 1",
      city: "Berlin",
      zip: "10115",
      countryCode: "DE" as const,
    },
    lineItems: [
      {
        type: "custom" as const,
        name: lexwareE2eResourceName("invoice item"),
        description: "Davids-KI-E2E-TEST",
        quantity: 1,
        unitName: "hour",
        unitPrice: { currency: "EUR" as const, netAmount: 1, taxRatePercentage: 19 },
      },
    ],
    totalPrice: { currency: "EUR" as const, totalNetAmount: 1 },
    taxConditions: { taxType: "net" as const },
    shippingConditions: { shippingType: "none" as const },
    paymentConditions: { paymentTermLabel: "sofort zahlbar", paymentTermDuration: 0 },
  }
}

function lexwareE2eCreditNoteBody(name: string) {
  return {
    title: "Davids-KI-E2E-TEST",
    voucherDate: lexwareE2eDateTime(),
    address: {
      name,
      street: "Davids-KI-E2E-TEST Street 2",
      city: "Berlin",
      zip: "10115",
      countryCode: "DE" as const,
    },
    lineItems: [
      {
        type: "custom" as const,
        name: lexwareE2eResourceName("credit-note item"),
        description: "Davids-KI-E2E-TEST",
        quantity: 1,
        unitName: "hour",
        unitPrice: { currency: "EUR" as const, netAmount: 1, taxRatePercentage: 19 },
      },
    ],
    totalPrice: { currency: "EUR" as const, totalNetAmount: 1 },
    taxConditions: { taxType: "net" as const },
  }
}

function lexwareE2eDateTime(daysFromNow = 0): string {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date.toISOString()
}

async function lexwareE2eDownloadRetry<T extends LiveResult>(
  operation: string,
  download: () => Promise<T>,
): Promise<T> {
  let result = await download()
  for (const [index, delayMilliseconds] of [2_000, 5_000, 10_000, 20_000].entries()) {
    if (result.success || result.statusCode !== 409) return result
    expect(result.statusCode).toBe(409)
    console.info(`Live E2E ${operation} explicit outcome: HTTP 409 (generation pending; retry ${index + 1}/4)`)
    await Bun.sleep(delayMilliseconds)
    result = await download()
  }
  return result
}

function lexwareE2eFileAssert(
  operation: string,
  result: LiveResult,
  expectedContentType: "application/pdf" | "application/xml",
): void {
  if (lexwareE2eScopeBlocked(operation, result)) return

  if (!result.success && result.statusCode === 409) {
    expect(result.statusCode).toBe(409)
    console.info(
      `Live E2E ${operation} explicit outcome: HTTP 409 (draft file unavailable or generation still pending)`,
    )
    return
  }

  if (!result.success && lexwareE2eFormatNotApplicable(result.statusCode)) {
    expect(result.statusCode).toBe(406)
    throw new Error(`Live E2E ${operation} requested format is not applicable; production coverage needs correction`)
  }

  const data = lexwareE2eResultAssert(operation, result as never)
  const response = data as { data: ArrayBuffer; contentType: string }
  expect(response.data.byteLength).toBeGreaterThan(0)
  expect(response.contentType).toBe(expectedContentType)
}

function lexwareE2eScopeBlocked(operation: string, result: LiveResult): boolean {
  if (result.success) return false
  if (result.statusCode !== 403) return false

  expect(result.success).toBe(false)
  expect(result.statusCode).toBe(403)
  console.info(`Live E2E ${operation} explicit outcome: HTTP 403 (missing API scope)`)
  return true
}

function lexwareE2eFormatNotApplicable(statusCode: number | undefined): boolean {
  return statusCode === 400 || statusCode === 404 || statusCode === 406 || statusCode === 415 || statusCode === 422
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

type LiveResult = {
  success: boolean
  statusCode?: number
  data?: unknown
}
