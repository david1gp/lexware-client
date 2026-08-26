import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import {
  deliveryNoteCreate,
  deliveryNoteGet,
  deliveryNotePdfDownload,
  lexwareClientCreate,
  orderConfirmationCreate,
  orderConfirmationGet,
  orderConfirmationPdfDownload,
} from "../dist/index.js"
import { lexwareE2eFetchCreate } from "./lexwareE2eFetchCreate.js"
import { lexwareE2eResourceName } from "./lexwareE2eResourceName.js"
import { lexwareE2eResultAssert } from "./lexwareE2eResultAssert.js"

const unavoidableLeftovers: string[] = []
let client: ReturnType<typeof lexwareE2eClientCreate>
let orderConfirmationId: string | undefined

beforeAll(() => {
  client = lexwareE2eClientCreate()
})

afterAll(() => {
  if (unavoidableLeftovers.length > 0) {
    console.info(
      `Live E2E unavoidable leftovers (the API exposes no delete operation): ${unavoidableLeftovers.join(", ")}`,
    )
  }
})

describe("order-confirmation live lifecycle", () => {
  test(
    "creates, gets, and downloads one finalized order confirmation",
    async () => {
      const name = lexwareE2eResourceName("order-confirmation")
      const createdResult = await orderConfirmationCreate(client, {
        finalize: true,
        orderConfirmation: lexwareE2eOrderConfirmationBody(name),
      })
      if (lexwareE2eScopeBlocked("orderConfirmationCreate", createdResult)) return

      const created = lexwareE2eResultAssert("orderConfirmationCreate", createdResult)
      orderConfirmationId = lexwareE2eResourceId(created)
      unavoidableLeftovers.push(`order confirmation ${name} (${orderConfirmationId})`)

      const fetched = lexwareE2eResultAssert(
        "orderConfirmationGet",
        await orderConfirmationGet(client, orderConfirmationId),
      )
      expect(lexwareE2eResourceId(fetched)).toBe(orderConfirmationId)

      const downloaded = await lexwareE2eDownloadRetry("orderConfirmationPdfDownload", () =>
        orderConfirmationPdfDownload(client, orderConfirmationId!),
      )
      const file = lexwareE2eResultAssert("orderConfirmationPdfDownload", downloaded)
      expect(file.data.byteLength).toBeGreaterThan(0)
      expect(file.contentType).toBe("application/pdf")
    },
    { timeout: 120_000 },
  )
})

describe("delivery-note live lifecycle", () => {
  test(
    "creates, gets, and exercises the PDF download endpoint",
    async () => {
      const name = lexwareE2eResourceName("delivery-note")
      const deliveryNoteInput = {
        deliveryNote: lexwareE2eDeliveryNoteBody(name),
        ...(orderConfirmationId === undefined ? {} : { precedingSalesVoucherId: orderConfirmationId }),
      }
      const createdResult = await deliveryNoteCreate(client, deliveryNoteInput)
      if (lexwareE2eScopeBlocked("deliveryNoteCreate", createdResult)) return

      const created = lexwareE2eResultAssert("deliveryNoteCreate", createdResult)
      const deliveryNoteId = lexwareE2eResourceId(created)
      unavoidableLeftovers.push(`delivery note ${name} (${deliveryNoteId})`)

      const fetched = lexwareE2eResultAssert("deliveryNoteGet", await deliveryNoteGet(client, deliveryNoteId))
      expect(fetched.id).toBe(deliveryNoteId)

      const downloaded = await deliveryNotePdfDownload(client, deliveryNoteId)
      if (downloaded.success) {
        expect(downloaded.data.data.byteLength).toBeGreaterThan(0)
        expect(downloaded.data.contentType).toBe("application/pdf")
        return
      }

      // This test creates a draft because pursue does not accept finalize=true. Draft files are documented as HTTP 409.
      expect(downloaded.statusCode).toBe(409)
      console.info("Live E2E deliveryNotePdfDownload explicit outcome: HTTP 409 (draft has no PDF file)")
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

function lexwareE2eOrderConfirmationBody(name: string) {
  return {
    voucherDate: lexwareE2eDateTime(),
    address: { name, countryCode: "DE" },
    lineItems: [
      {
        type: "custom" as const,
        name: lexwareE2eResourceName("order-confirmation item"),
        quantity: 1,
        unitName: "unit",
        unitPrice: { currency: "EUR" as const, netAmount: 1, taxRatePercentage: 19 },
      },
    ],
    totalPrice: { currency: "EUR" as const },
    taxConditions: { taxType: "net" as const },
    shippingConditions: { shippingType: "none" as const },
    title: "Davids-KI-E2E-TEST",
  }
}

function lexwareE2eDeliveryNoteBody(name: string) {
  return {
    voucherDate: lexwareE2eDateTime(),
    address: { name, countryCode: "DE" },
    lineItems: [
      {
        type: "custom" as const,
        name: lexwareE2eResourceName("delivery-note item"),
        quantity: 1,
        unitName: "unit",
        unitPrice: null,
      },
    ],
    taxConditions: { taxType: "net" as const },
    shippingConditions: { shippingType: "none" as const },
    title: "Davids-KI-E2E-TEST",
  }
}

function lexwareE2eDateTime(): string {
  return new Date().toISOString()
}

async function lexwareE2eDownloadRetry<T extends { success: boolean; statusCode?: number }>(
  operation: string,
  download: () => Promise<T>,
): Promise<T> {
  let result = await download()
  for (const [index, delayMilliseconds] of [2_000, 5_000, 10_000, 20_000].entries()) {
    if (result.success || result.statusCode !== 409) return result
    console.info(`Live E2E ${operation} HTTP 409; waiting for the file and retrying (${index + 1}/4)`)
    await Bun.sleep(delayMilliseconds)
    result = await download()
  }
  return result
}

function lexwareE2eScopeBlocked(operation: string, result: { success: boolean; statusCode?: number }): boolean {
  if (result.success || result.statusCode !== 403) return false
  console.info(`Live E2E ${operation} explicit outcome: HTTP 403 (missing API scope)`)
  return true
}

function lexwareE2eResourceId(value: unknown): string {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Live E2E returned an unexpected resource response")
  }

  const record = value as { id?: unknown; resourceUri?: unknown }
  if (typeof record.id === "string" && record.id.length > 0) return record.id
  if (typeof record.resourceUri === "string") {
    const resourceId = new URL(record.resourceUri).pathname.split("/").at(-1)
    if (resourceId) return resourceId
  }
  throw new Error("Live E2E resource response did not contain an id")
}
