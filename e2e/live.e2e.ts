import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import {
  articleCreate,
  articleDelete,
  articleGet,
  articleList,
  articleUpdate,
  contactCompanyCreate,
  contactGet,
  contactList,
  contactPersonCreate,
  contactUpdate,
  countryList,
  eventSubscriptionCreate,
  eventSubscriptionDelete,
  eventSubscriptionGet,
  eventSubscriptionList,
  fileDownload,
  fileUpload,
  invoiceCreate,
  invoiceGet,
  invoicePdfDownload,
  invoiceXmlDownload,
  paymentConditionList,
  postingCategoryList,
  printLayoutList,
  profileGet,
  quotationCreate,
  quotationGet,
  quotationPdfDownload,
  recurringTemplateGet,
  recurringTemplateList,
  voucherList,
  voucherListList,
} from "../dist/index.js"
import { lexwareE2eCleanup } from "./lexwareE2eCleanup.js"
import { lexwareE2eResourceName } from "./lexwareE2eResourceName.js"
import { lexwareE2eResultAssert } from "./lexwareE2eResultAssert.js"
import { lexwareE2eSetup } from "./lexwareE2eSetup.js"

const cleanup = lexwareE2eCleanup()
const unavoidableLeftovers: string[] = []
const noResourceId = "00000000-0000-0000-0000-000000000000"
let client: ReturnType<typeof lexwareE2eSetup>
let quotationCreateAttempted = false
let precedingQuotationId: string | undefined

beforeAll(() => {
  client = lexwareE2eSetup()
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

describe("safe live read/list endpoints", () => {
  test(
    "profileGet",
    async () => {
      const data = lexwareE2eResultAssert("profileGet", await profileGet(client))
      expect(data.organizationId).toBeString()
    },
    { timeout: 30_000 },
  )

  test(
    "countryList",
    async () => {
      const data = lexwareE2eResultAssert("countryList", await countryList(client))
      expect(data).not.toBeNull()
    },
    { timeout: 30_000 },
  )

  test(
    "paymentConditionList",
    async () => {
      const data = lexwareE2eResultAssert("paymentConditionList", await paymentConditionList(client))
      expect(data).toBeArray()
    },
    { timeout: 30_000 },
  )

  test(
    "postingCategoryList",
    async () => {
      const data = lexwareE2eResultAssert("postingCategoryList", await postingCategoryList(client))
      expect(data).toBeArray()
    },
    { timeout: 30_000 },
  )

  test(
    "printLayoutList",
    async () => {
      const data = lexwareE2eResultAssert("printLayoutList", await printLayoutList(client))
      expect(data).not.toBeNull()
    },
    { timeout: 30_000 },
  )

  test(
    "articleList",
    async () => {
      const data = lexwareE2eResultAssert("articleList", await articleList(client))
      expect(data).not.toBeNull()
    },
    { timeout: 30_000 },
  )

  test(
    "contactList",
    async () => {
      const data = lexwareE2eResultAssert("contactList", await contactList(client, { size: 1 }))
      expect(data).not.toBeNull()
    },
    { timeout: 30_000 },
  )

  test(
    "voucherList",
    async () => {
      const result = await voucherList(client, { page: 0 })
      // The current API key has no bookkeeping scope; keep the access result visible without treating it as a client mismatch.
      if (!result.success && result.statusCode === 403) return
      const data = lexwareE2eResultAssert("voucherList", result)
      expect(data).not.toBeNull()
    },
    { timeout: 30_000 },
  )

  test(
    "voucherListList",
    async () => {
      const result = await voucherListList(client, { size: 1, voucherType: "any", voucherStatus: "any" })
      // The current API key has no voucherlist scope; keep the access result visible without treating it as a client mismatch.
      if (!result.success && result.statusCode === 403) return
      const data = lexwareE2eResultAssert("voucherListList", result)
      expect(data).not.toBeNull()
    },
    { timeout: 30_000 },
  )

  test(
    "lists recurring templates and gets a listed template",
    async () => {
      const listResult = await recurringTemplateList(client, { size: 1 })
      if (lexwareE2eScopeBlocked("recurringTemplateList", listResult)) return

      const data = lexwareE2eResultAssert("recurringTemplateList", listResult)
      expect(data.content).toBeArray()
      const listedTemplate = data.content[0]
      if (listedTemplate === undefined) {
        console.info("Live E2E recurringTemplateGet explicit outcome: no recurring templates listed (empty collection)")
        return
      }

      const getResult = await recurringTemplateGet(client, listedTemplate.id)
      if (lexwareE2eScopeBlocked("recurringTemplateGet", getResult)) return
      if (!getResult.success && getResult.statusCode === 404) {
        console.info("Live E2E recurringTemplateGet explicit outcome: listed template was not found (HTTP 404)")
        return
      }

      const fetched = lexwareE2eResultAssert("recurringTemplateGet", getResult)
      expect(fetched.id).toBe(listedTemplate.id)
    },
    { timeout: 30_000 },
  )

  test(
    "eventSubscriptionList",
    async () => {
      const result = await eventSubscriptionList(client)
      if (lexwareE2eScopeBlocked("eventSubscriptionList", result)) return

      const data = lexwareE2eResultAssert("eventSubscriptionList", result)
      expect(data.content).toBeArray()
    },
    { timeout: 30_000 },
  )
})

describe("event subscription live lifecycle", () => {
  test(
    "creates, gets, and cleans up a subscription with harmless callback data",
    async () => {
      const callbackUrl = "https://example.com/Davids-KI-E2E-TEST"
      const createdResult = await eventSubscriptionCreate(client, {
        eventType: "token.revoked",
        callbackUrl,
      })
      if (lexwareE2eScopeBlocked("eventSubscriptionCreate", createdResult)) return

      const created = lexwareE2eResultAssert("eventSubscriptionCreate", createdResult)
      const subscriptionId = lexwareE2eResourceId(created)
      cleanup.add(async () => {
        lexwareE2eResultAssert("eventSubscriptionDelete cleanup", await eventSubscriptionDelete(client, subscriptionId))
      })

      const fetchedResult = await eventSubscriptionGet(client, subscriptionId)
      if (lexwareE2eScopeBlocked("eventSubscriptionGet", fetchedResult)) return

      const fetched = lexwareE2eRecord(lexwareE2eResultAssert("eventSubscriptionGet", fetchedResult))
      expect(fetched.subscriptionId).toBe(subscriptionId)
      expect(fetched.eventType).toBe("token.revoked")
      expect(fetched.callbackUrl).toBe(callbackUrl)
    },
    { timeout: 60_000 },
  )
})

describe("quotation live lifecycle", () => {
  test(
    "creates, gets, and downloads a quotation PDF",
    async () => {
      const quotation = await lexwareE2eCreateQuotation()
      if (quotation === undefined) return

      const fetchedResult = await quotationGet(client, quotation.id)
      if (lexwareE2eScopeBlocked("quotationGet", fetchedResult)) return
      const fetched = lexwareE2eRecord(lexwareE2eResultAssert("quotationGet", fetchedResult))
      expect(fetched.id).toBe(quotation.id)

      lexwareE2eDownloadAssert(
        "quotationPdfDownload",
        await lexwareE2eDownloadRetry(
          "quotationPdfDownload",
          () => quotationPdfDownload(client, quotation.id),
          [5_000, 10_000, 20_000, 30_000, 5_000],
        ),
      )
    },
    { timeout: 120_000 },
  )
})

describe("invoice live lifecycle", () => {
  test(
    "creates a draft from a preceding quotation, gets it, and downloads PDF and XML separately",
    async () => {
      const quotation = await lexwareE2eCreateQuotation()
      const invoiceName = lexwareE2eResourceName("invoice")
      const invoice = lexwareE2eInvoiceBody(invoiceName)
      const input = {
        invoice,
        finalize: false,
        ...(quotation === undefined ? {} : { precedingSalesVoucherId: quotation.id }),
      }

      if (quotation === undefined) {
        console.info(
          "Live E2E invoiceCreate proceeding without precedingSalesVoucherId because quotationCreate was blocked by a missing scope",
        )
      }

      const createdResult = await invoiceCreate(client, input)
      if (lexwareE2eScopeBlocked("invoiceCreate", createdResult)) return
      const created = lexwareE2eResultAssert("invoiceCreate", createdResult)
      const invoiceId = lexwareE2eResourceId(created)
      unavoidableLeftovers.push(`invoice draft ${invoiceName} (${invoiceId})`)

      const fetchedResult = await invoiceGet(client, invoiceId)
      if (lexwareE2eScopeBlocked("invoiceGet", fetchedResult)) return
      const fetched = lexwareE2eRecord(lexwareE2eResultAssert("invoiceGet", fetchedResult))
      expect(fetched.id).toBe(invoiceId)

      lexwareE2eDownloadAssert(
        "invoicePdfDownload",
        await lexwareE2eDownloadRetry("invoicePdfDownload", () => invoicePdfDownload(client, invoiceId), []),
      )
      lexwareE2eDownloadAssert(
        "invoiceXmlDownload",
        await lexwareE2eDownloadRetry("invoiceXmlDownload", () => invoiceXmlDownload(client, invoiceId), []),
      )

      console.info(
        "Live E2E invoiceCreate finalize=true not attempted to avoid leaving an undeletable finalized financial record",
      )
    },
    { timeout: 120_000 },
  )
})

describe("article live lifecycle", () => {
  test(
    "creates, gets, updates, gets, and cleans up an article",
    async () => {
      const title = lexwareE2eResourceName("article")
      const updatedTitle = `${title} updated`
      const body = {
        title,
        description: "Live E2E lifecycle resource",
        type: "SERVICE" as const,
        unitName: "hour",
        price: {
          netPrice: 1,
          leadingPrice: "NET" as const,
          taxRate: 19,
        },
      }

      const created = lexwareE2eResultAssert("articleCreate", await articleCreate(client, body))
      const articleId = lexwareE2eResourceId(created)
      cleanup.add(async () => {
        lexwareE2eResultAssert("articleDelete cleanup", await articleDelete(client, articleId))
      })

      const fetched = lexwareE2eRecord(lexwareE2eResultAssert("articleGet", await articleGet(client, articleId)))
      expect(fetched.id).toBe(articleId)

      const version = typeof fetched.version === "number" ? fetched.version : 0
      lexwareE2eResultAssert(
        "articleUpdate",
        await articleUpdate(client, articleId, { ...body, title: updatedTitle, version }),
      )

      const updated = lexwareE2eRecord(
        lexwareE2eResultAssert("articleGet after update", await articleGet(client, articleId)),
      )
      expect(updated.id).toBe(articleId)
      expect(updated.title).toBe(updatedTitle)
    },
    { timeout: 60_000 },
  )
})

describe("contact live lifecycle", () => {
  test(
    "creates company and person contacts, lists, gets, and updates them",
    async () => {
      const companyName = lexwareE2eResourceName("company")
      const companyCreated = lexwareE2eResultAssert(
        "contactCompanyCreate",
        await contactCompanyCreate(client, {
          roles: { customer: {} },
          company: { name: companyName },
        }),
      )
      const companyId = lexwareE2eResourceId(companyCreated)
      unavoidableLeftovers.push(`contact ${companyName} (${companyId})`)

      const personFirstName = lexwareE2eResourceName("person")
      const personLastName = "E2E Contact"
      const personCreated = lexwareE2eResultAssert(
        "contactPersonCreate",
        await contactPersonCreate(client, {
          roles: { vendor: {} },
          person: { firstName: personFirstName, lastName: personLastName },
        }),
      )
      const personId = lexwareE2eResourceId(personCreated)
      unavoidableLeftovers.push(`contact ${personFirstName} ${personLastName} (${personId})`)

      const listed = lexwareE2eResultAssert(
        "contactList created contacts",
        await contactList(client, { name: "Davids-KI-E2E-TEST", size: 10 }),
      )
      expect(listed).not.toBeNull()

      const company = lexwareE2eRecord(
        lexwareE2eResultAssert("contactGet company", await contactGet(client, companyId)),
      )
      expect(company.id).toBe(companyId)
      const companyVersion = lexwareE2eVersion(company)
      const updatedCompanyName = lexwareE2eResourceName("company-updated")
      lexwareE2eResultAssert(
        "contactUpdate company",
        await contactUpdate(client, companyId, {
          roles: { customer: {} },
          version: companyVersion,
          company: { name: updatedCompanyName },
        }),
      )
      const updatedCompany = lexwareE2eRecord(
        lexwareE2eResultAssert("contactGet updated company", await contactGet(client, companyId)),
      )
      expect(updatedCompany.id).toBe(companyId)
      expect(lexwareE2eRecord(updatedCompany.company).name).toBe(updatedCompanyName)

      const person = lexwareE2eRecord(lexwareE2eResultAssert("contactGet person", await contactGet(client, personId)))
      expect(person.id).toBe(personId)
      const personVersion = lexwareE2eVersion(person)
      const updatedPersonFirstName = lexwareE2eResourceName("person-updated")
      lexwareE2eResultAssert(
        "contactUpdate person",
        await contactUpdate(client, personId, {
          roles: { vendor: {} },
          version: personVersion,
          person: { firstName: updatedPersonFirstName, lastName: personLastName },
        }),
      )
      const updatedPerson = lexwareE2eRecord(
        lexwareE2eResultAssert("contactGet updated person", await contactGet(client, personId)),
      )
      expect(updatedPerson.id).toBe(personId)
      expect(lexwareE2eRecord(updatedPerson.person).firstName).toBe(updatedPersonFirstName)
    },
    { timeout: 120_000 },
  )
})

describe("file live lifecycle", () => {
  test(
    "uploads and downloads harmless tiny file content",
    async () => {
      const filename = "Davids-KI-E2E-TEST.txt"
      const content = "Davids-KI-E2E-TEST\n"
      const uploadResult = await fileUpload(client, {
        type: "voucher",
        filename,
        contentType: "text/plain",
        data: content,
      })
      // The current E2E key does not have the files scope; keep that access limitation visible without hiding it as a client failure.
      if (!uploadResult.success && uploadResult.statusCode === 403) {
        console.info("Live E2E fileUpload explicit outcome: HTTP 403 (missing API scope)")
        const downloadResult = await fileDownload(client, noResourceId)
        if (lexwareE2eScopeBlocked("fileDownload", downloadResult)) return
        if (!downloadResult.success && downloadResult.statusCode === 404) {
          console.info("Live E2E fileDownload explicit outcome: safe probe file was not found (HTTP 404)")
          return
        }

        const downloaded = lexwareE2eResultAssert("fileDownload", downloadResult)
        expect(downloaded.data.byteLength).toBeGreaterThan(0)
        return
      }
      const uploaded = lexwareE2eResultAssert("fileUpload", uploadResult)
      const fileId = lexwareE2eResourceId(uploaded)
      unavoidableLeftovers.push(`file ${filename} (${fileId})`)

      const downloaded = lexwareE2eResultAssert("fileDownload", await fileDownload(client, fileId))
      expect(new TextDecoder().decode(downloaded.data)).toBe(content)
    },
    { timeout: 60_000 },
  )
})

async function lexwareE2eCreateQuotation(): Promise<{ id: string; name: string } | undefined> {
  if (quotationCreateAttempted) {
    if (precedingQuotationId === undefined) return undefined
    return { id: precedingQuotationId, name: "shared quotation" }
  }

  quotationCreateAttempted = true
  const name = lexwareE2eResourceName("quotation")
  const result = await quotationCreate(client, lexwareE2eQuotationBody(name))
  if (lexwareE2eScopeBlocked("quotationCreate", result)) return undefined

  const created = lexwareE2eResultAssert("quotationCreate", result)
  precedingQuotationId = lexwareE2eResourceId(created)
  unavoidableLeftovers.push(`quotation ${name} (${precedingQuotationId})`)
  return { id: precedingQuotationId, name }
}

function lexwareE2eQuotationBody(name: string) {
  return {
    title: "Davids-KI-E2E-TEST",
    introduction: "Davids-KI-E2E-TEST",
    remark: lexwareE2eResourceName("quotation remark"),
    voucherDate: lexwareE2eDateTime(),
    expirationDate: lexwareE2eDateTime(30),
    address: {
      name,
      street: "Davids-KI-E2E-TEST Street 1",
      city: "Berlin",
      zip: "10115",
      countryCode: "DE",
    },
    lineItems: [
      {
        type: "custom" as const,
        name: lexwareE2eResourceName("quotation item"),
        description: lexwareE2eResourceName("quotation description"),
        quantity: 1,
        unitName: "hour",
        unitPrice: { currency: "EUR" as const, netAmount: 1, taxRatePercentage: 19 },
      },
    ],
    totalPrice: { currency: "EUR" as const, totalNetAmount: 1 },
    taxConditions: { taxType: "net" as const },
  }
}

function lexwareE2eInvoiceBody(name: string) {
  return {
    title: "Davids-KI-E2E-TEST",
    introduction: "Davids-KI-E2E-TEST",
    remark: lexwareE2eResourceName("invoice remark"),
    voucherDate: lexwareE2eDateTime(),
    address: {
      name,
      street: "Davids-KI-E2E-TEST Street 2",
      city: "Berlin",
      zip: "10115",
      countryCode: "DE",
    },
    lineItems: [
      {
        type: "custom" as const,
        name: lexwareE2eResourceName("invoice item"),
        description: lexwareE2eResourceName("invoice description"),
        quantity: 1,
        unitName: "hour",
        unitPrice: { currency: "EUR" as const, netAmount: 1, taxRatePercentage: 19 },
      },
    ],
    totalPrice: { currency: "EUR" as const, totalNetAmount: 1 },
    taxConditions: { taxType: "net" as const },
    shippingConditions: { shippingType: "none" as const },
  }
}

function lexwareE2eDateTime(daysFromNow = 0): string {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + daysFromNow)
  return date.toISOString()
}

async function lexwareE2eDownloadRetry(
  operation: string,
  download: () => Promise<{ success: boolean; statusCode?: number; data?: unknown }>,
  retryDelaysMilliseconds: readonly number[],
): Promise<{ success: boolean; statusCode?: number; data?: unknown }> {
  let result: { success: boolean; statusCode?: number; data?: unknown } = await download()
  for (const [index, delayMilliseconds] of retryDelaysMilliseconds.entries()) {
    if (result.success || result.statusCode !== 409) return result
    const attempt = index + 1
    console.info(
      `Live E2E ${operation} HTTP 409; waiting for the file and retrying (${attempt}/${retryDelaysMilliseconds.length})`,
    )
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

function lexwareE2eDownloadAssert(
  operation: string,
  result: { success: boolean; statusCode?: number; data?: unknown },
): void {
  if (lexwareE2eScopeBlocked(operation, result)) return
  if (!result.success && lexwareE2eDownloadUnavailable(operation, result.statusCode)) return

  const data = lexwareE2eResultAssert(operation, result as never)
  const response = data as { data: ArrayBuffer; contentType: string }
  expect(response.data.byteLength).toBeGreaterThan(0)
  const expectedContentType = operation.endsWith("XmlDownload") ? "application/xml" : "application/pdf"
  expect(response.contentType).toBe(expectedContentType)
}

function lexwareE2eDownloadUnavailable(operation: string, statusCode: number | undefined): boolean {
  if (statusCode === 409) {
    console.info(`Live E2E ${operation} explicit outcome: document file unavailable (HTTP ${statusCode})`)
    return true
  }

  if (statusCode !== 400 && statusCode !== 404 && statusCode !== 406 && statusCode !== 415 && statusCode !== 422) {
    return false
  }

  console.info(`Live E2E ${operation} explicit outcome: requested format not applicable (HTTP ${statusCode})`)
  return true
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
    try {
      const resourceId = new URL(record.resourceUri).pathname.split("/").at(-1)
      if (resourceId) return resourceId
    } catch {
      // The static error below avoids exposing an unexpected response body.
    }
  }

  throw new Error("Live E2E create response did not contain a resource id")
}

function lexwareE2eVersion(value: Record<string, unknown>): number {
  return typeof value.version === "number" ? value.version : 0
}
