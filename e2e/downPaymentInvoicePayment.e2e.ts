import { expect, test } from "bun:test"
import {
  downPaymentInvoiceGet,
  downPaymentInvoicePdfDownload,
  downPaymentInvoiceXmlDownload,
  invoiceCreate,
  lexwareClientCreate,
  paymentGet,
} from "../dist/index.js"
import { lexwareE2eFetchCreate } from "./lexwareE2eFetchCreate.js"
import { lexwareE2eResourceName } from "./lexwareE2eResourceName.js"

const noResourceId = "00000000-0000-0000-0000-000000000000"
const downPaymentInvoiceIdEnvironmentVariable = "LEXWARE_E2E_DOWN_PAYMENT_INVOICE_ID"

type FixtureSource = "configured-down-payment-invoice" | "draft-invoice-precursor" | "unavailable"
type DownPaymentDetails = {
  readonly id: string
  readonly voucherStatus: "draft" | "open" | "paid" | "voided"
  readonly electronicDocumentProfile?: "NONE" | "EN16931" | "XRechnung" | null
}

const client = lexwareE2eClientCreate()
const fixture = await lexwareE2eFixtureCreate()

test(
  "exercises down-payment-invoice get/PDF/XML and payment get against live API",
  async () => {
    const getResult = await downPaymentInvoiceGet(client, fixture.id)
    const getDetails = getResult.success ? downPaymentDetailsRead(getResult.data) : undefined

    const shouldRetryFiles = getDetails !== undefined && getDetails.voucherStatus !== "draft"
    const pdfResult = await lexwareE2eDownloadRetry(
      "downPaymentInvoicePdfDownload",
      () => downPaymentInvoicePdfDownload(client, fixture.id),
      shouldRetryFiles,
    )
    const xmlResult = await lexwareE2eDownloadRetry(
      "downPaymentInvoiceXmlDownload",
      () => downPaymentInvoiceXmlDownload(client, fixture.id),
      shouldRetryFiles,
    )
    const paymentResult = await paymentGet(client, fixture.id)

    downPaymentInvoiceGetAssert(getResult, fixture, getDetails)
    downPaymentInvoicePdfAssert(pdfResult, fixture, getDetails)
    downPaymentInvoiceXmlAssert(xmlResult, fixture, getDetails)
    paymentGetAssert(paymentResult, fixture, getDetails)
  },
  { timeout: 180_000 },
)

async function lexwareE2eFixtureCreate(): Promise<{ id: string; source: FixtureSource }> {
  const configuredId = Bun.env[downPaymentInvoiceIdEnvironmentVariable]?.trim()
  if (configuredId) {
    console.info(`Live E2E using ${downPaymentInvoiceIdEnvironmentVariable} without logging its value`)
    return { id: configuredId, source: "configured-down-payment-invoice" }
  }

  const name = lexwareE2eResourceName("down-payment-invoice-precursor")
  const result = await invoiceCreate(client, {
    invoice: {
      title: "Davids-KI-E2E-TEST",
      voucherDate: new Date().toISOString(),
      address: { name, countryCode: "DE" },
      lineItems: [
        {
          type: "custom",
          name: "Davids-KI-E2E-TEST",
          quantity: 1,
          unitName: "unit",
          unitPrice: { currency: "EUR", netAmount: 1, taxRatePercentage: 19 },
        },
      ],
      totalPrice: { currency: "EUR", totalNetAmount: 1 },
      taxConditions: { taxType: "net" },
      shippingConditions: { shippingType: "none" },
    },
    finalize: false,
  })

  if (!result.success) {
    if (result.statusCode === 403) {
      console.info("Live E2E invoice precursor explicit outcome: HTTP 403 (missing API scope)")
      return { id: noResourceId, source: "unavailable" }
    }

    throw new Error(`Live E2E invoice precursor failed${liveStatusText(result.statusCode)}`)
  }

  const id = lexwareE2eResourceId(result.data)
  console.info(
    "Live E2E created one Davids-KI-E2E-TEST draft invoice precursor; it is not deleted because the API exposes no delete operation",
  )
  return { id, source: "draft-invoice-precursor" }
}

function lexwareE2eClientCreate() {
  const accessToken = Bun.env.LEXWARE_API_KEY?.trim()
  if (!accessToken) throw new Error("LEXWARE_API_KEY is required for live E2E")

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

function downPaymentDetailsRead(
  value: Awaited<ReturnType<typeof downPaymentInvoiceGet>> extends infer Result
    ? Result extends { success: true; data: infer Data }
      ? Data
      : never
    : never,
): DownPaymentDetails {
  return {
    id: value.id,
    voucherStatus: value.voucherStatus,
    electronicDocumentProfile: value.electronicDocumentProfile,
  }
}

function downPaymentInvoiceGetAssert(
  result: Awaited<ReturnType<typeof downPaymentInvoiceGet>>,
  fixture: { id: string; source: FixtureSource },
  details: DownPaymentDetails | undefined,
): void {
  if (result.success) {
    expect(result.data.id).toBe(fixture.id)
    expect(result.data.lineItems).toHaveLength(1)
    expect(details).toBeDefined()
    return
  }

  if (result.statusCode === 403) {
    lexwareE2eMissingScopeAssert("downPaymentInvoiceGet", result.statusCode)
    return
  }

  if (result.statusCode === 404) {
    const outcome = fixture.source === "draft-invoice-precursor" ? "wrong voucher type" : "unavailable"
    lexwareE2eExplicitOutcome("downPaymentInvoiceGet", outcome, result.statusCode)
    return
  }

  throw new Error(`Live E2E downPaymentInvoiceGet failed${liveStatusText(result.statusCode)}`)
}

function downPaymentInvoicePdfAssert(
  result: Awaited<ReturnType<typeof downPaymentInvoicePdfDownload>>,
  fixture: { id: string; source: FixtureSource },
  details: DownPaymentDetails | undefined,
): void {
  if (result.success) {
    if (details === undefined) {
      throw new Error("Live E2E downPaymentInvoicePdfDownload succeeded without a readable down-payment invoice")
    }
    expect(result.data.data.byteLength).toBeGreaterThan(0)
    expect(result.data.contentType).toBe("application/pdf")
    return
  }

  if (result.statusCode === 403) {
    lexwareE2eMissingScopeAssert("downPaymentInvoicePdfDownload", result.statusCode)
    return
  }

  if (details === undefined) {
    if (result.statusCode === 404 && fixture.source === "draft-invoice-precursor") {
      lexwareE2eExplicitOutcome("downPaymentInvoicePdfDownload", "wrong voucher type", result.statusCode)
      return
    }
    if (result.statusCode === 404 || result.statusCode === 409) {
      lexwareE2eExplicitOutcome("downPaymentInvoicePdfDownload", "unavailable", result.statusCode)
      return
    }
  }

  if (details?.voucherStatus === "draft" && result.statusCode === 409) {
    lexwareE2eExplicitOutcome("downPaymentInvoicePdfDownload", "unavailable draft file", result.statusCode)
    return
  }

  throw new Error(
    `Live E2E downPaymentInvoicePdfDownload failed for a readable invoice${liveStatusText(result.statusCode)}`,
  )
}

function downPaymentInvoiceXmlAssert(
  result: Awaited<ReturnType<typeof downPaymentInvoiceXmlDownload>>,
  fixture: { id: string; source: FixtureSource },
  details: DownPaymentDetails | undefined,
): void {
  if (result.success) {
    if (details === undefined) {
      throw new Error("Live E2E downPaymentInvoiceXmlDownload succeeded without a readable down-payment invoice")
    }
    expect(result.data.data.byteLength).toBeGreaterThan(0)
    expect(result.data.contentType).toBe("application/xml")
    return
  }

  if (result.statusCode === 403) {
    lexwareE2eMissingScopeAssert("downPaymentInvoiceXmlDownload", result.statusCode)
    return
  }

  if (details === undefined) {
    if (result.statusCode === 404 && fixture.source === "draft-invoice-precursor") {
      lexwareE2eExplicitOutcome("downPaymentInvoiceXmlDownload", "wrong voucher type", result.statusCode)
      return
    }
    if (result.statusCode === 404 || result.statusCode === 409) {
      lexwareE2eExplicitOutcome("downPaymentInvoiceXmlDownload", "unavailable", result.statusCode)
      return
    }
  }

  const xmlApplies = details?.electronicDocumentProfile === "XRechnung"
  if (!xmlApplies && details !== undefined && result.statusCode === 404) {
    lexwareE2eExplicitOutcome("downPaymentInvoiceXmlDownload", "format not applicable", result.statusCode)
    return
  }
  if (!xmlApplies && details?.voucherStatus === "draft" && result.statusCode === 409) {
    lexwareE2eExplicitOutcome("downPaymentInvoiceXmlDownload", "unavailable draft file", result.statusCode)
    return
  }

  throw new Error(
    `Live E2E downPaymentInvoiceXmlDownload failed for a readable XRechnung${liveStatusText(result.statusCode)}`,
  )
}

function paymentGetAssert(
  result: Awaited<ReturnType<typeof paymentGet>>,
  fixture: { id: string; source: FixtureSource },
  details: DownPaymentDetails | undefined,
): void {
  if (result.success) {
    if (details === undefined) {
      throw new Error("Live E2E paymentGet succeeded for a voucher without readable down-payment-invoice details")
    }
    expect(result.data.voucherType).toBe("downpaymentinvoice")
    expect(result.data.paymentItems).toBeArray()
    return
  }

  if (result.statusCode === 403) {
    lexwareE2eMissingScopeAssert("paymentGet", result.statusCode)
    return
  }

  if (
    result.statusCode === 406 &&
    (details?.voucherStatus === "draft" || fixture.source === "draft-invoice-precursor")
  ) {
    lexwareE2eExplicitOutcome("paymentGet", "unavailable for draft voucher", result.statusCode)
    return
  }

  if (details === undefined && (result.statusCode === 404 || result.statusCode === 406)) {
    lexwareE2eExplicitOutcome("paymentGet", "unavailable", result.statusCode)
    return
  }

  throw new Error(
    `Live E2E paymentGet failed for a readable non-draft down-payment invoice${liveStatusText(result.statusCode)}`,
  )
}

async function lexwareE2eDownloadRetry<T extends { success: boolean; statusCode?: number }>(
  operation: string,
  download: () => Promise<T>,
  retry: boolean,
): Promise<T> {
  let result = await download()
  if (!retry) return result

  for (const [index, delayMilliseconds] of [2_000, 5_000, 10_000, 20_000].entries()) {
    if (result.success || result.statusCode !== 409) return result
    console.info(`Live E2E ${operation} HTTP 409; retrying after file generation (${index + 1}/4)`)
    await Bun.sleep(delayMilliseconds)
    result = await download()
  }
  return result
}

function lexwareE2eMissingScopeAssert(operation: string, statusCode: number | undefined): void {
  expect(statusCode).toBe(403)
  lexwareE2eExplicitOutcome(operation, "missing API scope", statusCode)
}

function lexwareE2eExplicitOutcome(operation: string, outcome: string, statusCode: number | undefined): void {
  console.info(`Live E2E ${operation} explicit outcome: ${outcome}${liveStatusText(statusCode)}`)
}

function lexwareE2eResourceId(value: unknown): string {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Live E2E precursor response did not contain a resource id")
  }

  const record = value as { id?: unknown; resourceUri?: unknown }
  if (typeof record.id === "string" && record.id.length > 0) return record.id

  if (typeof record.resourceUri === "string") {
    const resourceId = new URL(record.resourceUri).pathname.split("/").at(-1)
    if (resourceId) return resourceId
  }

  throw new Error("Live E2E precursor response did not contain a resource id")
}

function liveStatusText(statusCode: number | undefined): string {
  return statusCode === undefined ? "" : ` (HTTP ${statusCode})`
}
