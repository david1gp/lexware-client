import { expect, test } from "bun:test"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

type CliExecution = {
  readonly exitCode: number
  readonly stderr: string
  readonly stdout: string
}

type CliResult = {
  readonly errorMessage?: unknown
  readonly op?: unknown
  readonly success: unknown
  readonly data?: unknown
  readonly statusCode?: unknown
}

type CliRunOptions = {
  readonly cwd?: string
  readonly environment?: Readonly<Record<string, string>>
  readonly executable?: string
  readonly runtime?: CliRuntime
  readonly unsetEnvironment?: readonly string[]
}

type CliRuntime = "bun" | "node"

type MockApiRequest = {
  readonly authorization: string | null
  body?: unknown
  readonly method: string
  readonly path: string
  readonly query: Record<string, string>
}

type MockApiHandler = (request: Request, url: URL, captured: MockApiRequest) => Response | Promise<Response>

type MockApi = {
  readonly baseUrl: string
  readonly requests: MockApiRequest[]
  readonly stop: () => void
}

const sourceCliPath = new URL("./cli.ts", import.meta.url).pathname
const builtCliPath = new URL("../dist/cli.js", import.meta.url).pathname

test("CLI success and help output are JSON", async () => {
  const root = await cliExecutableRun([])
  expect(root.exitCode).toBe(0)
  expect(root.stderr).toBe("")
  expect(cliResultParse(root.stdout)).toEqual({
    success: true,
    data: { command: "lexware", brief: "Run Lexware Office API commands" },
  })

  const help = await cliExecutableRun(["--help"])
  expect(help.exitCode).toBe(0)
  expect(help.stderr).toBe("")
  const helpResult = cliResultParse(help.stdout)
  expect(helpResult.success).toBe(true)
  expect(helpResult.data).toBeString()
  expect(helpResult.data).toContain("lexware article")
  expect(helpResult.data).toContain("--env-path")

  const nestedHelp = await cliExecutableRun(["invoice", "create", "--help"])
  expect(nestedHelp.exitCode).toBe(0)
  expect(nestedHelp.stderr).toBe("")
  const nestedHelpResult = cliResultParse(nestedHelp.stdout)
  expect(nestedHelpResult.success).toBe(true)
  expect(nestedHelpResult.data).toContain("--line-item-type]...")
  expect(nestedHelpResult.data).toContain("--env-path")

  const missingEnvPath = await cliExecutableRun(["--env-path", "--help"])
  expect(missingEnvPath.exitCode).not.toBe(0)
  expect(missingEnvPath.stdout).toBe("")
  expect(cliResultParse(missingEnvPath.stderr)).toEqual({
    success: false,
    op: "cliRunInputsPrepare",
    errorMessage: "--env-path requires a path",
  })
})

test("CLI passes official contact list filters", async () => {
  const api = mockApiStart(async (request, url) => {
    if (request.method === "GET" && url.pathname === "/v1/contacts") return jsonResponse({ content: [] })
    return jsonResponse({ success: false, op: "mockApi", errorMessage: "Unexpected request" }, { status: 500 })
  })

  try {
    const result = await cliExecutableRun([
      "contact",
      "list",
      "--base-url",
      api.baseUrl,
      "--access-token",
      "token",
      "--page",
      "0",
      "--size",
      "250",
      "--email",
      "johnson & partner",
      "--name",
      "A_b%",
      "--number",
      "123",
      "--customer",
      "false",
      "--vendor",
      "true",
    ])

    expect(result.exitCode).toBe(0)
    expect(cliResultParse(result.stdout)).toEqual({ success: true, data: { content: [] } })
    expect(api.requests).toEqual([
      {
        authorization: "Bearer token",
        method: "GET",
        path: "/v1/contacts",
        query: {
          page: "0",
          size: "250",
          email: "johnson & partner",
          name: "A_b%",
          number: "123",
          customer: "false",
          vendor: "true",
        },
      },
    ])
  } finally {
    api.stop()
  }
})

test("CLI exposes and executes payment and payment-condition operations", async () => {
  const paymentResponse = {
    openAmount: 0,
    currency: "EUR",
    paymentStatus: "balanced",
    voucherType: "salesinvoice",
    voucherStatus: "paid",
    paymentItems: [],
  }
  const paymentConditions = [
    {
      id: "payment-condition-1",
      paymentTermLabelTemplate: "Zahlbar in {paymentRange} Tagen",
      paymentTermDuration: 14,
      organizationDefault: true,
    },
  ]
  const api = mockApiStart(async (request, url) => {
    if (request.method === "GET" && url.pathname === "/v1/payments/voucher-1") return jsonResponse(paymentResponse)
    if (request.method === "GET" && url.pathname === "/v1/payment-conditions") return jsonResponse(paymentConditions)
    return jsonResponse({ success: false, op: "mockApi", errorMessage: "Unexpected request" }, { status: 500 })
  })

  const clientArgs = ["--base-url", api.baseUrl, "--access-token", "token"]

  try {
    const help = await cliExecutableRun(["--help"])
    expect(help.exitCode).toBe(0)
    expect(help.stdout).toContain("payments get-by-voucher")
    expect(help.stdout).toContain("payment-conditions list")

    const payment = await cliExecutableRun(["payments", "get-by-voucher", ...clientArgs, "--voucher-id", "voucher-1"])
    expect(payment.exitCode).toBe(0)
    expect(cliResultParse(payment.stdout)).toEqual({ success: true, data: paymentResponse })

    const paymentCondition = await cliExecutableRun(["payment-conditions", "list", ...clientArgs])
    expect(paymentCondition.exitCode).toBe(0)
    expect(cliResultParse(paymentCondition.stdout)).toEqual({ success: true, data: paymentConditions })

    expect(api.requests).toEqual([
      { authorization: "Bearer token", method: "GET", path: "/v1/payments/voucher-1", query: {} },
      { authorization: "Bearer token", method: "GET", path: "/v1/payment-conditions", query: {} },
    ])
  } finally {
    api.stop()
  }
})

test("CLI exposes and executes event-subscription operations", async () => {
  const api = mockApiStart(async (request, url, captured) => {
    if (request.method === "POST" && url.pathname === "/v1/event-subscriptions") {
      captured.body = JSON.parse(await request.text()) as unknown
      return jsonResponse({
        id: "subscription-1",
        resourceUri: "https://api.lexware.io/v1/event-subscriptions/subscription-1",
        createdDate: "2026-08-26T12:00:00.000+02:00",
        updatedDate: "2026-08-26T12:00:00.000+02:00",
        version: 0,
      })
    }

    if (request.method === "GET" && url.pathname === "/v1/event-subscriptions") {
      return jsonResponse({ content: [eventSubscriptionResponse] })
    }

    if (request.method === "GET" && url.pathname === "/v1/event-subscriptions/subscription-1") {
      return jsonResponse(eventSubscriptionResponse)
    }

    if (request.method === "DELETE" && url.pathname === "/v1/event-subscriptions/subscription-1") {
      return new Response(null, { status: 204 })
    }

    return jsonResponse({ success: false, op: "mockApi", errorMessage: "Unexpected request" }, { status: 500 })
  })

  const clientArgs = ["--base-url", api.baseUrl, "--access-token", "token"]

  try {
    const help = await cliExecutableRun(["event-subscription", "--help"])
    expect(help.exitCode).toBe(0)
    expect(help.stderr).toBe("")
    expect(help.stdout).toContain("create  Create an event subscription")
    expect(help.stdout).toContain("get     Get an event subscription")
    expect(help.stdout).toContain("list    List event subscriptions")
    expect(help.stdout).toContain("delete  Delete an event subscription")

    const create = await cliExecutableRun([
      "event-subscription",
      "create",
      ...clientArgs,
      "--event-type",
      "contact.changed",
      "--callback-url",
      "https://example.org/webhook",
    ])
    expect(create.exitCode).toBe(0)
    expect(cliResultParse(create.stdout)).toEqual({
      success: true,
      data: {
        id: "subscription-1",
        resourceUri: "https://api.lexware.io/v1/event-subscriptions/subscription-1",
        createdDate: "2026-08-26T12:00:00.000+02:00",
        updatedDate: "2026-08-26T12:00:00.000+02:00",
        version: 0,
      },
    })
    expect(api.requests[0]).toMatchObject({
      method: "POST",
      path: "/v1/event-subscriptions",
      body: { eventType: "contact.changed", callbackUrl: "https://example.org/webhook" },
    })

    const get = await cliExecutableRun(["event-subscription", "get", ...clientArgs, "--id", "subscription-1"])
    expect(get.exitCode).toBe(0)
    expect(cliResultParse(get.stdout)).toEqual({ success: true, data: eventSubscriptionResponse })

    const list = await cliExecutableRun(["event-subscription", "list", ...clientArgs])
    expect(list.exitCode).toBe(0)
    expect(cliResultParse(list.stdout)).toEqual({ success: true, data: { content: [eventSubscriptionResponse] } })

    const remove = await cliExecutableRun(["event-subscription", "delete", ...clientArgs, "--id", "subscription-1"])
    expect(remove.exitCode).toBe(0)
    expect(cliResultParse(remove.stdout)).toEqual({ success: true, data: null })
    expect(api.requests).toHaveLength(4)
    expect(api.requests[3]).toMatchObject({ method: "DELETE", path: "/v1/event-subscriptions/subscription-1" })
  } finally {
    api.stop()
  }
})

test("CLI uploads a file attachment to a voucher", async () => {
  const directory = await mkdtemp(join(tmpdir(), "lexware-cli-voucher-"))
  const uploadPath = join(directory, "receipt.pdf")
  await writeFile(uploadPath, "pdf contents")
  const api = mockApiStart(async (request, url, captured) => {
    if (request.method === "POST" && url.pathname === "/v1/vouchers/voucher-1/files") {
      const form = await request.formData()
      const file = form.get("file")
      captured.body = {
        contents: file instanceof File ? await file.text() : null,
        filename: file instanceof File ? file.name : null,
        type: file instanceof File ? file.type : null,
      }
      return jsonResponse({ id: "file-1", voucherId: "voucher-1" })
    }

    return jsonResponse({ success: false, op: "mockApi", errorMessage: "Unexpected request" }, { status: 500 })
  })

  try {
    const help = await cliExecutableRun(["voucher", "--help"])
    expect(help.exitCode).toBe(0)
    expect(help.stdout).toContain("file-upload")

    const upload = await cliExecutableRun([
      "voucher",
      "file-upload",
      "--base-url",
      api.baseUrl,
      "--access-token",
      "token",
      "--id",
      "voucher-1",
      "--filename",
      "receipt.pdf",
      "--content-type",
      "application/pdf",
      "--path",
      uploadPath,
    ])
    expect(upload.exitCode).toBe(0)
    expect(upload.stderr).toBe("")
    expect(cliResultParse(upload.stdout)).toEqual({
      success: true,
      data: { id: "file-1", voucherId: "voucher-1" },
    })
    expect(api.requests).toEqual([
      {
        authorization: "Bearer token",
        method: "POST",
        path: "/v1/vouchers/voucher-1/files",
        query: {},
        body: { contents: "pdf contents", filename: "receipt.pdf", type: "application/pdf" },
      },
    ])
  } finally {
    api.stop()
    await rm(directory, { force: true, recursive: true })
  }
})

test("CLI creates a bookkeeping voucher with numeric item flags", async () => {
  const api = mockApiStart(async (request, url, captured) => {
    if (request.method === "POST" && url.pathname === "/v1/vouchers") {
      captured.body = JSON.parse(await request.text()) as unknown
      return jsonResponse({ id: "voucher-1" })
    }

    return jsonResponse({ success: false, op: "mockApi", errorMessage: "Unexpected request" }, { status: 500 })
  })

  try {
    const result = await cliExecutableRun([
      "voucher",
      "create",
      "--base-url",
      api.baseUrl,
      "--access-token",
      "token",
      "--type",
      "purchaseinvoice",
      "--voucher-status",
      "open",
      "--voucher-number",
      "E2E-1",
      "--voucher-date",
      "2026-08-26",
      "--tax-type",
      "gross",
      "--use-collective-contact",
      "true",
      "--total-gross-amount",
      "1.19",
      "--total-tax-amount",
      "0.19",
      "--voucher-item-amount",
      "1.19",
      "--voucher-item-tax-amount",
      "0.19",
      "--voucher-item-tax-rate-percent",
      "19",
      "--voucher-item-category-id",
      "cf03a2b0-f838-474f-ac5e-67adb9b830c7",
    ])

    expect(result.exitCode).toBe(0)
    expect(cliResultParse(result.stdout)).toEqual({ success: true, data: { id: "voucher-1" } })
    expect(api.requests).toEqual([
      {
        authorization: "Bearer token",
        method: "POST",
        path: "/v1/vouchers",
        query: {},
        body: {
          type: "purchaseinvoice",
          voucherStatus: "open",
          voucherNumber: "E2E-1",
          voucherDate: "2026-08-26",
          totalGrossAmount: 1.19,
          totalTaxAmount: 0.19,
          taxType: "gross",
          useCollectiveContact: true,
          voucherItems: [
            {
              amount: 1.19,
              taxAmount: 0.19,
              taxRatePercent: 19,
              categoryId: "cf03a2b0-f838-474f-ac5e-67adb9b830c7",
            },
          ],
        },
      },
    ])
  } finally {
    api.stop()
  }
})

test("CLI updates a bookkeeping voucher with retained file IDs", async () => {
  const api = mockApiStart(async (request, url, captured) => {
    if (request.method === "PUT" && url.pathname === "/v1/vouchers/voucher-1") {
      captured.body = JSON.parse(await request.text()) as unknown
      return jsonResponse({ id: "voucher-1" })
    }

    return jsonResponse({ success: false, op: "mockApi", errorMessage: "Unexpected request" }, { status: 500 })
  })

  try {
    const result = await cliExecutableRun([
      "voucher",
      "update",
      "--base-url",
      api.baseUrl,
      "--access-token",
      "token",
      "--id",
      "voucher-1",
      "--type",
      "purchaseinvoice",
      "--voucher-status",
      "open",
      "--voucher-number",
      "E2E-1",
      "--voucher-date",
      "2026-08-26",
      "--tax-type",
      "gross",
      "--use-collective-contact",
      "true",
      "--total-gross-amount",
      "1.19",
      "--total-tax-amount",
      "0.19",
      "--voucher-item-amount",
      "1.19",
      "--voucher-item-tax-amount",
      "0.19",
      "--voucher-item-tax-rate-percent",
      "19",
      "--voucher-item-category-id",
      "cf03a2b0-f838-474f-ac5e-67adb9b830c7",
      "--file-id",
      "file-1",
      "--version",
      "1",
    ])

    expect(result.exitCode).toBe(0)
    expect(cliResultParse(result.stdout)).toEqual({ success: true, data: { id: "voucher-1" } })
    expect(api.requests[0]).toMatchObject({
      authorization: "Bearer token",
      method: "PUT",
      path: "/v1/vouchers/voucher-1",
      body: {
        voucherNumber: "E2E-1",
        files: ["file-1"],
        version: 1,
      },
    })
  } finally {
    api.stop()
  }
})

test("CLI exposes and executes recurring-template get and list operations", async () => {
  const recurringTemplate = {
    id: "template-1",
    organizationId: "organization-1",
    createdDate: "2026-01-01T12:00:00.000+01:00",
    updatedDate: "2026-01-01T12:00:00.000+01:00",
    version: 0,
    language: "de",
    archived: false,
    address: { contactId: "contact-1", name: "Example GmbH", countryCode: "DE" },
    lineItems: [
      {
        type: "custom",
        name: "Consulting",
        quantity: 1,
        unitPrice: { currency: "EUR", netAmount: 100, grossAmount: 119, taxRatePercentage: 19 },
        lineItemAmount: 100,
      },
    ],
    totalPrice: { currency: "EUR", totalNetAmount: 100, totalGrossAmount: 119, totalTaxAmount: 19 },
    taxAmounts: [{ taxRatePercentage: 19, taxAmount: 19, netAmount: 100 }],
    taxConditions: { taxType: "net" },
    paymentConditions: { paymentTermDuration: 0 },
    title: "Invoice",
    recurringTemplateSettings: {
      id: "settings-1",
      startDate: "2026-01-01",
      endDate: null,
      finalize: true,
      shippingType: "none",
      retroactiveInvoice: false,
      executionInterval: "MONTHLY",
      nextExecutionDate: "2026-02-01",
      lastExecutionDate: null,
      lastExecutionFailed: false,
      lastExecutionErrorMessage: null,
      executionStatus: "ACTIVE",
    },
  }
  const page = {
    content: [recurringTemplate],
    first: true,
    last: true,
    totalPages: 1,
    totalElements: 1,
    numberOfElements: 1,
    size: 10,
    number: 0,
    sort: [{ property: "createdDate", direction: "DESC", ignoreCase: false, nullHandling: "NATIVE", ascending: false }],
  }
  const api = mockApiStart(async (request, url) => {
    if (request.method === "GET" && url.pathname === "/v1/recurring-templates/template-1") {
      return jsonResponse(recurringTemplate)
    }
    if (request.method === "GET" && url.pathname === "/v1/recurring-templates") return jsonResponse(page)
    return jsonResponse({ success: false, op: "mockApi", errorMessage: "Unexpected request" }, { status: 500 })
  })

  const clientArgs = ["--base-url", api.baseUrl, "--access-token", "token"]

  try {
    const help = await cliExecutableRun(["recurring-template", "--help"])
    expect(help.exitCode).toBe(0)
    expect(help.stdout).toContain("get   Get a recurring template")
    expect(help.stdout).toContain("list  List recurring templates")

    const get = await cliExecutableRun(["recurring-template", "get", ...clientArgs, "--id", "template-1"])
    expect(get.exitCode).toBe(0)
    expect(cliResultParse(get.stdout)).toEqual({ success: true, data: recurringTemplate })

    const list = await cliExecutableRun([
      "recurring-template",
      "list",
      ...clientArgs,
      "--page",
      "2",
      "--size",
      "10",
      "--sort",
      "createdDate,DESC",
    ])
    expect(list.exitCode).toBe(0)
    expect(cliResultParse(list.stdout)).toEqual({ success: true, data: page })
    expect(api.requests).toEqual([
      { authorization: "Bearer token", method: "GET", path: "/v1/recurring-templates/template-1", query: {} },
      {
        authorization: "Bearer token",
        method: "GET",
        path: "/v1/recurring-templates",
        query: { page: "2", size: "10", sort: "createdDate,DESC" },
      },
    ])
  } finally {
    api.stop()
  }
})

const eventSubscriptionResponse = {
  subscriptionId: "subscription-1",
  organizationId: "organization-1",
  createdDate: "2026-08-26T12:00:00.000+02:00",
  eventType: "contact.changed",
  callbackUrl: "https://example.org/webhook",
}

test("quotation CLI exposes documented operations", async () => {
  const help = await cliExecutableRun(["quotation", "--help"])

  expect(help.exitCode).toBe(0)
  expect(help.stderr).toBe("")
  expect(help.stdout).toContain("create        Create a quotation")
  expect(help.stdout).toContain("get           Get a quotation")
  expect(help.stdout).toContain("pdf-download  Download a quotation PDF")
  expect(help.stdout).not.toContain("update        Update a quotation")
  expect(help.stdout).not.toContain("list          List quotations")
  expect(help.stdout).not.toContain("delete        Delete a quotation")
})

test("dunning CLI exposes create, get, and PDF-download", async () => {
  const help = await cliExecutableRun(["dunning", "--help"])

  expect(help.exitCode).toBe(0)
  expect(help.stderr).toBe("")
  expect(help.stdout).toContain("create        Create a dunning")
  expect(help.stdout).toContain("get           Get a dunning")
  expect(help.stdout).toContain("pdf-download  Download a dunning PDF")
  expect(help.stdout).not.toContain("xml-download")
})

test("CLI exposes invoice, order-confirmation, quotation, and dunning routes", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "lexware-cli-sales-vouchers-"))
  const api = mockApiStart(async (request, url, captured) => {
    if (request.method === "POST" && url.pathname === "/v1/invoices") {
      captured.body = JSON.parse(await request.text()) as unknown
      return jsonResponse({ id: "invoice-1" })
    }

    if (request.method === "GET" && url.pathname === "/v1/invoices/invoice-1") return jsonResponse({ id: "invoice-1" })

    if (request.method === "POST" && url.pathname === "/v1/order-confirmations") {
      captured.body = JSON.parse(await request.text()) as unknown
      return jsonResponse({ id: "order-confirmation-1" })
    }

    if (request.method === "GET" && url.pathname === "/v1/order-confirmations/order-confirmation-1") {
      return jsonResponse({ id: "order-confirmation-1" })
    }

    if (request.method === "POST" && url.pathname === "/v1/quotations") {
      captured.body = JSON.parse(await request.text()) as unknown
      return jsonResponse({ id: "quotation-1" })
    }

    if (request.method === "GET" && url.pathname === "/v1/quotations/quotation-1") {
      return jsonResponse({ id: "quotation-1" })
    }

    if (request.method === "GET" && url.pathname === "/v1/invoices/dunning-invoice-1") {
      return jsonResponse({
        address: { name: "Example customer", countryCode: "DE" },
        lineItems: [],
        taxConditions: { taxType: "net" },
        totalPrice: { currency: "EUR" },
      })
    }

    if (request.method === "POST" && url.pathname === "/v1/dunnings") {
      captured.body = JSON.parse(await request.text()) as unknown
      return jsonResponse({ id: "dunning-1" })
    }

    if (request.method === "GET" && url.pathname === "/v1/dunnings/dunning-1") {
      return jsonResponse({ id: "dunning-1" })
    }

    if (request.method === "GET" && url.pathname.endsWith("/file")) {
      return new Response(Uint8Array.from([1, 2, 3]), {
        headers: { "Content-Type": request.headers.get("Accept") ?? "application/pdf" },
      })
    }

    return jsonResponse({ success: false, op: "mockApi", errorMessage: "Unexpected request" }, { status: 500 })
  })

  const clientArgs = ["--base-url", api.baseUrl, "--access-token", "token"]

  try {
    const help = await cliExecutableRun(["--help"], { cwd })
    expect(help.stdout).toContain("invoice create|get|pdf-download|xml-download")
    expect(help.stdout).toContain("order-confirmation create|get|pdf-download")
    expect(help.stdout).toContain("quotation create|get|pdf-download")
    expect(help.stdout).toContain("dunning create|get|pdf-download")

    const invoiceCreate = await cliExecutableRun(
      [
        "invoice",
        "create",
        ...clientArgs,
        "--preceding-sales-voucher-id",
        "preceding-invoice-1",
        "--finalize",
        "true",
        "--voucher-date",
        "2026-08-16T00:00",
        "--address-name",
        "Example customer",
        "--address-country-code",
        "DE",
        "--line-item-type",
        "custom",
        "--line-item-name",
        "Consulting",
        "--line-item-quantity",
        "1",
        "--line-item-unit-name",
        "Hours",
        "--line-item-unit-price-currency",
        "EUR",
        "--line-item-unit-price-net-amount",
        "100",
        "--line-item-unit-price-tax-rate-percentage",
        "19",
        "--total-price-currency",
        "EUR",
        "--tax-conditions-tax-type",
        "net",
        "--shipping-conditions-shipping-type",
        "none",
      ],
      { cwd },
    )
    expect(invoiceCreate.exitCode).toBe(0)
    expect(cliResultParse(invoiceCreate.stdout)).toEqual({ success: true, data: { id: "invoice-1" } })
    expect(api.requests[0]).toMatchObject({
      method: "POST",
      path: "/v1/invoices",
      query: { precedingSalesVoucherId: "preceding-invoice-1", finalize: "true" },
    })

    const invoiceGet = await cliExecutableRun(["invoice", "get", ...clientArgs, "--id", "invoice-1"], { cwd })
    expect(invoiceGet.exitCode).toBe(0)
    expect(cliResultParse(invoiceGet.stdout)).toEqual({ success: true, data: { id: "invoice-1" } })

    for (const format of ["pdf", "xml"] as const) {
      const download = await cliExecutableRun(["invoice", `${format}-download`, ...clientArgs, "--id", "invoice-1"], {
        cwd,
      })
      expect(download.exitCode).toBe(0)
      expect(cliResultParse(download.stdout)).toMatchObject({
        success: true,
        data: { contentType: `application/${format}`, byteLength: 3, output: null },
      })
    }

    const orderConfirmationCreate = await cliExecutableRun(
      [
        "order-confirmation",
        "create",
        ...clientArgs,
        "--preceding-sales-voucher-id",
        "invoice-1",
        "--finalize",
        "true",
      ],
      { cwd },
    )
    expect(orderConfirmationCreate.exitCode).toBe(0)
    expect(cliResultParse(orderConfirmationCreate.stdout)).toEqual({
      success: true,
      data: { id: "order-confirmation-1" },
    })
    expect(api.requests[4]).toMatchObject({
      method: "POST",
      path: "/v1/order-confirmations",
      query: { precedingSalesVoucherId: "invoice-1" },
    })

    const orderConfirmationGet = await cliExecutableRun(
      ["order-confirmation", "get", ...clientArgs, "--id", "order-confirmation-1"],
      { cwd },
    )
    expect(orderConfirmationGet.exitCode).toBe(0)
    expect(cliResultParse(orderConfirmationGet.stdout)).toEqual({
      success: true,
      data: { id: "order-confirmation-1" },
    })

    const orderConfirmationPdf = await cliExecutableRun(
      ["order-confirmation", "pdf-download", ...clientArgs, "--id", "order-confirmation-1"],
      { cwd },
    )
    expect(orderConfirmationPdf.exitCode).toBe(0)
    expect(cliResultParse(orderConfirmationPdf.stdout)).toMatchObject({
      success: true,
      data: { contentType: "application/pdf", byteLength: 3, output: null },
    })

    const quotationCreate = await cliExecutableRun(
      [
        "quotation",
        "create",
        ...clientArgs,
        "--voucher-date",
        "2026-08-16T00:00",
        "--expiration-date",
        "2026-09-16T00:00",
        "--address-name",
        "Example customer",
        "--address-country-code",
        "DE",
        "--line-item-type",
        "custom",
        "--line-item-name",
        "Consulting",
        "--line-item-quantity",
        "1",
        "--line-item-unit-name",
        "Hours",
        "--line-item-unit-price-currency",
        "EUR",
        "--line-item-unit-price-net-amount",
        "100",
        "--line-item-unit-price-tax-rate-percentage",
        "19",
        "--total-price-currency",
        "EUR",
        "--tax-conditions-tax-type",
        "net",
      ],
      { cwd },
    )
    expect(quotationCreate.exitCode).toBe(0)
    expect(cliResultParse(quotationCreate.stdout)).toEqual({ success: true, data: { id: "quotation-1" } })

    const quotationGet = await cliExecutableRun(["quotation", "get", ...clientArgs, "--id", "quotation-1"], { cwd })
    expect(quotationGet.exitCode).toBe(0)
    expect(cliResultParse(quotationGet.stdout)).toEqual({ success: true, data: { id: "quotation-1" } })

    const quotationPdf = await cliExecutableRun(["quotation", "pdf-download", ...clientArgs, "--id", "quotation-1"], {
      cwd,
    })
    expect(quotationPdf.exitCode).toBe(0)
    expect(cliResultParse(quotationPdf.stdout)).toMatchObject({
      success: true,
      data: { contentType: "application/pdf", byteLength: 3, output: null },
    })

    const dunningCreate = await cliExecutableRun(
      [
        "dunning",
        "create",
        ...clientArgs,
        "--preceding-sales-voucher-id",
        "dunning-invoice-1",
        "--finalize",
        "true",
        "--voucher-date",
        "2026-08-16T00:00:00.000Z",
      ],
      { cwd },
    )
    expect(dunningCreate.exitCode).toBe(0)
    expect(cliResultParse(dunningCreate.stdout)).toEqual({ success: true, data: { id: "dunning-1" } })
    expect(api.requests[11]).toMatchObject({
      method: "POST",
      path: "/v1/dunnings",
      query: { precedingSalesVoucherId: "dunning-invoice-1", finalize: "true" },
    })

    const dunningGet = await cliExecutableRun(["dunning", "get", ...clientArgs, "--id", "dunning-1"], { cwd })
    expect(dunningGet.exitCode).toBe(0)
    expect(cliResultParse(dunningGet.stdout)).toEqual({ success: true, data: { id: "dunning-1" } })

    const dunningPdf = await cliExecutableRun(["dunning", "pdf-download", ...clientArgs, "--id", "dunning-1"], {
      cwd,
    })
    expect(dunningPdf.exitCode).toBe(0)
    expect(cliResultParse(dunningPdf.stdout)).toMatchObject({
      success: true,
      data: { contentType: "application/pdf", byteLength: 3, output: null },
    })

    expect(api.requests).toHaveLength(14)
  } finally {
    api.stop()
    await rm(cwd, { force: true, recursive: true })
  }
})

test("CLI exposes the current order-confirmation operations", async () => {
  const accepts: string[] = []
  const api = mockApiStart(async (request, url, captured) => {
    if (request.method === "POST" && url.pathname === "/v1/order-confirmations") {
      captured.body = JSON.parse(await request.text()) as unknown
      return jsonResponse({
        id: captured.query.precedingSalesVoucherId ? "pursued-order-confirmation-1" : "order-confirmation-1",
      })
    }

    if (request.method === "GET" && url.pathname.endsWith("/order-confirmation-1")) {
      return jsonResponse({ id: "order-confirmation-1" })
    }

    if (request.method === "GET" && url.pathname.endsWith("/file")) {
      accepts.push(request.headers.get("Accept") ?? "")
      return new Response(Uint8Array.from([1, 2, 3]), {
        headers: { "Content-Type": request.headers.get("Accept") ?? "application/pdf" },
      })
    }

    return jsonResponse({ success: false, op: "mockApi", errorMessage: "Unexpected request" }, { status: 500 })
  })

  const clientArgs = ["--base-url", api.baseUrl, "--access-token", "token"]

  try {
    const help = await cliExecutableRun(["order-confirmation", "--help"])
    expect(help.exitCode).toBe(0)
    expect(help.stdout).toContain("create        Create an order confirmation")
    expect(help.stdout).toContain("get           Get an order confirmation")
    expect(help.stdout).toContain("pdf-download  Download an order confirmation PDF")
    expect(help.stdout).not.toContain("list          List order confirmations")
    expect(help.stdout).not.toContain("delete        Delete an order confirmation")

    const create = await cliExecutableRun(["order-confirmation", "create", ...clientArgs, "--finalize", "true"])
    expect(create.exitCode).toBe(0)
    expect(cliResultParse(create.stdout)).toEqual({ success: true, data: { id: "order-confirmation-1" } })
    expect(api.requests[0]).toMatchObject({
      method: "POST",
      path: "/v1/order-confirmations",
      query: { finalize: "true" },
      body: {},
    })

    const pursue = await cliExecutableRun([
      "order-confirmation",
      "create",
      ...clientArgs,
      "--preceding-sales-voucher-id",
      "invoice-1",
      "--finalize",
      "true",
    ])
    expect(pursue.exitCode).toBe(0)
    expect(cliResultParse(pursue.stdout)).toEqual({
      success: true,
      data: { id: "pursued-order-confirmation-1" },
    })
    expect(api.requests[1]).toMatchObject({
      method: "POST",
      path: "/v1/order-confirmations",
      query: { precedingSalesVoucherId: "invoice-1" },
      body: {},
    })
    expect(api.requests[1]?.query).not.toHaveProperty("finalize")

    const get = await cliExecutableRun(["order-confirmation", "get", ...clientArgs, "--id", "order-confirmation-1"])
    expect(get.exitCode).toBe(0)
    expect(cliResultParse(get.stdout)).toEqual({ success: true, data: { id: "order-confirmation-1" } })

    const pdf = await cliExecutableRun([
      "order-confirmation",
      "pdf-download",
      ...clientArgs,
      "--id",
      "order-confirmation-1",
    ])
    expect(pdf.exitCode).toBe(0)
    expect(cliResultParse(pdf.stdout)).toMatchObject({
      success: true,
      data: { contentType: "application/pdf", byteLength: 3, output: null },
    })
    expect(accepts).toEqual(["application/pdf"])
    expect(api.requests).toHaveLength(4)
  } finally {
    api.stop()
  }
})

test("CLI exposes all current invoice operations", async () => {
  const accepts: string[] = []
  const api = mockApiStart(async (request, url, captured) => {
    if (request.method === "POST" && url.pathname === "/v1/invoices") {
      captured.body = JSON.parse(await request.text()) as unknown
      return jsonResponse({ id: "invoice-1" })
    }

    if (request.method === "GET" && url.pathname === "/v1/invoices/invoice-1") {
      return jsonResponse({ id: "invoice-1" })
    }

    if (request.method === "GET" && url.pathname === "/v1/invoices/invoice-1/file") {
      accepts.push(request.headers.get("Accept") ?? "")
      return new Response(Uint8Array.from([1, 2, 3]), {
        headers: { "Content-Type": request.headers.get("Accept") ?? "" },
      })
    }

    return jsonResponse({ success: false, op: "mockApi", errorMessage: "Unexpected request" }, { status: 500 })
  })

  const clientArgs = ["--base-url", api.baseUrl, "--access-token", "token"]

  try {
    const create = await cliExecutableRun([
      "invoice",
      "create",
      ...clientArgs,
      "--preceding-sales-voucher-id",
      "preceding-invoice-1",
      "--finalize",
      "true",
      "--voucher-date",
      "2026-08-16T00:00:00.000Z",
      "--address-name",
      "Example customer",
      "--address-country-code",
      "DE",
      "--line-item-type",
      "custom",
      "--line-item-name",
      "Consulting",
      "--line-item-quantity",
      "1",
      "--line-item-unit-name",
      "Hours",
      "--line-item-unit-price-currency",
      "EUR",
      "--line-item-unit-price-net-amount",
      "100",
      "--line-item-unit-price-tax-rate-percentage",
      "19",
      "--total-price-currency",
      "EUR",
      "--tax-conditions-tax-type",
      "net",
      "--shipping-conditions-shipping-type",
      "none",
    ])
    expect(create.exitCode).toBe(0)
    expect(cliResultParse(create.stdout)).toEqual({ success: true, data: { id: "invoice-1" } })
    expect(api.requests[0]).toMatchObject({
      method: "POST",
      path: "/v1/invoices",
      query: { precedingSalesVoucherId: "preceding-invoice-1", finalize: "true" },
    })

    const get = await cliExecutableRun(["invoice", "get", ...clientArgs, "--id", "invoice-1"])
    expect(get.exitCode).toBe(0)
    expect(cliResultParse(get.stdout)).toEqual({ success: true, data: { id: "invoice-1" } })

    for (const format of ["pdf", "xml"] as const) {
      const download = await cliExecutableRun(["invoice", `${format}-download`, ...clientArgs, "--id", "invoice-1"])
      expect(download.exitCode).toBe(0)
      expect(cliResultParse(download.stdout)).toMatchObject({
        success: true,
        data: { contentType: `application/${format}`, byteLength: 3, output: null },
      })
    }

    expect(accepts).toEqual(["application/pdf", "application/xml"])
    expect(api.requests).toHaveLength(4)
  } finally {
    api.stop()
  }
})

test("CLI exposes credit-note routes", async () => {
  const api = mockApiStart(async (request, url, captured) => {
    if (request.method === "POST" && url.pathname === "/v1/credit-notes") {
      captured.body = JSON.parse(await request.text()) as unknown
      return jsonResponse({ id: "credit-note-1" })
    }

    if (request.method === "GET" && url.pathname === "/v1/credit-notes/credit-note-1") {
      return jsonResponse({
        id: "credit-note-1",
        organizationId: "organization-1",
        createdDate: "2026-08-16T00:00:00.000+02:00",
        updatedDate: "2026-08-16T00:00:00.000+02:00",
        version: 1,
        language: "de",
        archived: false,
        voucherStatus: "draft",
        voucherNumber: null,
        voucherDate: "2026-08-16T00:00:00.000+02:00",
        address: { name: "Example customer", countryCode: "DE" },
        electronicDocumentProfile: "NONE",
        lineItems: [
          {
            type: "custom",
            name: "Consulting",
            quantity: 1,
            unitName: "Hours",
            unitPrice: { currency: "EUR", netAmount: 100, taxRatePercentage: 19 },
          },
        ],
        totalPrice: { currency: "EUR", totalNetAmount: 100 },
        taxAmounts: [{ taxRatePercentage: 19, taxAmount: 19, netAmount: 100 }],
        taxConditions: { taxType: "net" },
        shippingConditions: { shippingType: "none" },
        relatedVouchers: [],
      })
    }

    if (request.method === "GET" && url.pathname === "/v1/credit-notes/credit-note-1/file") {
      return new Response(Uint8Array.from([1, 2, 3]), {
        headers: { "Content-Type": request.headers.get("Accept") ?? "" },
      })
    }

    return jsonResponse({ success: false, op: "mockApi", errorMessage: "Unexpected request" }, { status: 500 })
  })

  try {
    const help = await cliExecutableRun(["--help"])
    expect(help.stdout).toContain("credit-note create|get|pdf-download|xml-download")

    const creditNoteCreate = await cliExecutableRun([
      "credit-note",
      "create",
      "--base-url",
      api.baseUrl,
      "--access-token",
      "token",
      "--preceding-sales-voucher-id",
      "invoice-1",
      "--finalize",
      "true",
      "--voucher-date",
      "2026-08-16T00:00:00.000Z",
      "--address-name",
      "Example customer",
      "--address-country-code",
      "DE",
      "--line-item-type",
      "custom",
      "--line-item-name",
      "Consulting",
      "--line-item-quantity",
      "1",
      "--line-item-unit-name",
      "Hours",
      "--line-item-unit-price-currency",
      "EUR",
      "--line-item-unit-price-net-amount",
      "100",
      "--line-item-unit-price-tax-rate-percentage",
      "19",
      "--total-price-currency",
      "EUR",
      "--tax-conditions-tax-type",
      "net",
    ])
    expect(creditNoteCreate).toMatchObject({ exitCode: 0 })
    expect(cliResultParse(creditNoteCreate.stdout)).toEqual({ success: true, data: { id: "credit-note-1" } })
    expect(api.requests[0]).toMatchObject({
      method: "POST",
      path: "/v1/credit-notes",
      query: { precedingSalesVoucherId: "invoice-1", finalize: "true" },
      body: {
        address: { name: "Example customer", countryCode: "DE" },
        lineItems: [
          {
            type: "custom",
            name: "Consulting",
            quantity: 1,
            unitName: "Hours",
            unitPrice: { currency: "EUR", netAmount: 100, taxRatePercentage: 19 },
          },
        ],
        totalPrice: { currency: "EUR" },
        taxConditions: { taxType: "net" },
      },
    })

    const creditNoteGet = await cliExecutableRun([
      "credit-note",
      "get",
      "--base-url",
      api.baseUrl,
      "--access-token",
      "token",
      "--id",
      "credit-note-1",
    ])
    expect(creditNoteGet.exitCode).toBe(0)
    expect(cliResultParse(creditNoteGet.stdout)).toMatchObject({ success: true, data: { id: "credit-note-1" } })

    const creditNotePdf = await cliExecutableRun([
      "credit-note",
      "pdf-download",
      "--base-url",
      api.baseUrl,
      "--access-token",
      "token",
      "--id",
      "credit-note-1",
    ])
    expect(creditNotePdf.exitCode).toBe(0)
    expect(cliResultParse(creditNotePdf.stdout)).toMatchObject({
      success: true,
      data: { contentType: "application/pdf", byteLength: 3, output: null },
    })

    const creditNoteXml = await cliExecutableRun([
      "credit-note",
      "xml-download",
      "--base-url",
      api.baseUrl,
      "--access-token",
      "token",
      "--id",
      "credit-note-1",
    ])
    expect(creditNoteXml.exitCode).toBe(0)
    expect(cliResultParse(creditNoteXml.stdout)).toMatchObject({
      success: true,
      data: { contentType: "application/xml", byteLength: 3, output: null },
    })

    expect(api.requests).toHaveLength(4)
  } finally {
    api.stop()
  }
})

test("CLI exposes delivery-note create, get, and PDF-download routes", async () => {
  const api = mockApiStart(async (request, url, captured) => {
    if (request.method === "POST" && url.pathname === "/v1/delivery-notes") {
      captured.body = JSON.parse(await request.text()) as unknown
      return jsonResponse({
        id: "delivery-note-1",
        resourceUri: "https://api.lexware.io/v1/delivery-notes/delivery-note-1",
        createdDate: "2026-08-16T00:00:00.000+02:00",
        updatedDate: "2026-08-16T00:00:00.000+02:00",
        version: 1,
      })
    }

    if (request.method === "GET" && url.pathname === "/v1/delivery-notes/delivery-note-1") {
      return jsonResponse({
        id: "delivery-note-1",
        organizationId: "organization-1",
        createdDate: "2026-08-16T00:00:00.000+02:00",
        updatedDate: "2026-08-16T00:00:00.000+02:00",
        version: 1,
        language: "de",
        archived: false,
        voucherStatus: "draft",
        voucherNumber: null,
        voucherDate: "2026-08-16T00:00:00.000+02:00",
        address: { name: "Example customer", countryCode: "DE" },
        electronicDocumentProfile: "NONE",
        lineItems: [{ type: "custom", name: "Consulting", quantity: 1, unitName: "Hours", unitPrice: null }],
        taxConditions: { taxType: "net" },
        relatedVouchers: [],
      })
    }

    if (request.method === "GET" && url.pathname === "/v1/delivery-notes/delivery-note-1/file") {
      return new Response(Uint8Array.from([1, 2, 3]), {
        headers: { "Content-Type": "application/pdf" },
      })
    }

    return jsonResponse({ success: false, op: "mockApi", errorMessage: "Unexpected request" }, { status: 500 })
  })

  try {
    const help = await cliExecutableRun(["--help"])
    expect(help.stdout).toContain("delivery-note create|get|pdf-download")

    const create = await cliExecutableRun([
      "delivery-note",
      "create",
      "--base-url",
      api.baseUrl,
      "--access-token",
      "token",
      "--preceding-sales-voucher-id",
      "invoice-1",
      "--finalize",
      "true",
      "--voucher-date",
      "2026-08-16T00:00",
      "--address-name",
      "Example customer",
      "--address-country-code",
      "DE",
      "--line-item-type",
      "custom",
      "--line-item-name",
      "Consulting",
      "--line-item-quantity",
      "1",
      "--line-item-unit-name",
      "Hours",
      "--tax-conditions-tax-type",
      "net",
      "--shipping-conditions-shipping-type",
      "none",
    ])
    expect(create.exitCode).toBe(0)
    expect(cliResultParse(create.stdout)).toMatchObject({ success: true, data: { id: "delivery-note-1" } })
    expect(api.requests[0]).toMatchObject({
      method: "POST",
      path: "/v1/delivery-notes",
      body: {
        address: { name: "Example customer", countryCode: "DE" },
        lineItems: [{ type: "custom", name: "Consulting", quantity: 1, unitName: "Hours" }],
        taxConditions: { taxType: "net" },
        shippingConditions: { shippingType: "none" },
      },
    })
    expect(api.requests[0]?.query).toEqual({ precedingSalesVoucherId: "invoice-1" })

    const get = await cliExecutableRun([
      "delivery-note",
      "get",
      "--base-url",
      api.baseUrl,
      "--access-token",
      "token",
      "--id",
      "delivery-note-1",
    ])
    expect(get.exitCode).toBe(0)
    expect(cliResultParse(get.stdout)).toMatchObject({ success: true, data: { id: "delivery-note-1" } })

    const pdf = await cliExecutableRun([
      "delivery-note",
      "pdf-download",
      "--base-url",
      api.baseUrl,
      "--access-token",
      "token",
      "--id",
      "delivery-note-1",
    ])
    expect(pdf.exitCode).toBe(0)
    expect(cliResultParse(pdf.stdout)).toMatchObject({
      success: true,
      data: { contentType: "application/pdf", byteLength: 3, output: null },
    })

    expect(api.requests).toHaveLength(3)
    expect(api.requests[1]).toMatchObject({ method: "GET", path: "/v1/delivery-notes/delivery-note-1" })
    expect(api.requests[2]).toMatchObject({ method: "GET", path: "/v1/delivery-notes/delivery-note-1/file" })
  } finally {
    api.stop()
  }
})

test("CLI exposes down-payment-invoice get, PDF-download, and XML-download routes", async () => {
  const api = mockApiStart(async (request, url) => {
    if (request.method === "GET" && url.pathname === "/v1/down-payment-invoices/down-payment-invoice-1") {
      return jsonResponse({
        id: "down-payment-invoice-1",
        organizationId: "organization-1",
        createdDate: "2026-08-16T00:00:00.000+02:00",
        updatedDate: "2026-08-16T00:00:00.000+02:00",
        version: 1,
        language: "de",
        archived: false,
        voucherStatus: "open",
        voucherNumber: "RE1129",
        voucherDate: "2026-08-16T00:00:00.000+02:00",
        dueDate: "2026-09-15T00:00:00.000+02:00",
        address: { name: "Example customer", countryCode: "DE" },
        electronicDocumentProfile: "NONE",
        lineItems: [
          {
            type: "custom",
            name: "Pauschaler Abschlag",
            quantity: 1,
            unitPrice: { currency: "EUR", netAmount: 100, grossAmount: 119, taxRatePercentage: 19 },
            lineItemAmount: 119,
          },
        ],
        totalPrice: { currency: "EUR", totalNetAmount: 100, totalGrossAmount: 119, totalTaxAmount: 19 },
        taxAmounts: [{ taxRatePercentage: 19, taxAmount: 19, netAmount: 100 }],
        taxConditions: { taxType: "gross" },
        paymentConditions: {
          paymentTermLabel: "30 Tage netto",
          paymentTermLabelTemplate: "{paymentRange} Tage netto",
          paymentTermDuration: 30,
        },
        shippingConditions: { shippingType: "none" },
        closingInvoiceId: null,
        relatedVouchers: [],
        printLayoutId: null,
        title: "1. Abschlagsrechnung",
        introduction: null,
        remark: "Vielen Dank.",
      })
    }

    if (request.method === "GET" && url.pathname === "/v1/down-payment-invoices/down-payment-invoice-1/file") {
      return new Response(Uint8Array.from([1, 2, 3]), {
        headers: { "Content-Type": request.headers.get("Accept") ?? "" },
      })
    }

    return jsonResponse({ success: false, op: "mockApi", errorMessage: "Unexpected request" }, { status: 500 })
  })

  try {
    const help = await cliExecutableRun(["--help"])
    expect(help.stdout).toContain("down-payment-invoice get|pdf-download|xml-download")

    const get = await cliExecutableRun([
      "down-payment-invoice",
      "get",
      "--base-url",
      api.baseUrl,
      "--access-token",
      "token",
      "--id",
      "down-payment-invoice-1",
    ])
    expect(get.exitCode).toBe(0)
    expect(cliResultParse(get.stdout)).toMatchObject({ success: true, data: { id: "down-payment-invoice-1" } })

    const pdf = await cliExecutableRun([
      "down-payment-invoice",
      "pdf-download",
      "--base-url",
      api.baseUrl,
      "--access-token",
      "token",
      "--id",
      "down-payment-invoice-1",
    ])
    expect(pdf.exitCode).toBe(0)
    expect(cliResultParse(pdf.stdout)).toMatchObject({
      success: true,
      data: { contentType: "application/pdf", byteLength: 3, output: null },
    })

    const xml = await cliExecutableRun([
      "down-payment-invoice",
      "xml-download",
      "--base-url",
      api.baseUrl,
      "--access-token",
      "token",
      "--id",
      "down-payment-invoice-1",
    ])
    expect(xml.exitCode).toBe(0)
    expect(cliResultParse(xml.stdout)).toMatchObject({
      success: true,
      data: { contentType: "application/xml", byteLength: 3, output: null },
    })

    expect(api.requests).toHaveLength(3)
    expect(api.requests[0]).toMatchObject({ method: "GET", path: "/v1/down-payment-invoices/down-payment-invoice-1" })
    expect(api.requests[1]).toMatchObject({
      method: "GET",
      path: "/v1/down-payment-invoices/down-payment-invoice-1/file",
    })
    expect(api.requests[2]).toMatchObject({
      method: "GET",
      path: "/v1/down-payment-invoices/down-payment-invoice-1/file",
    })
  } finally {
    api.stop()
  }
})

test("CLI delegates representative read and write routes to the API", async () => {
  const api = mockApiStart(async (request, url, captured) => {
    if (request.method === "GET" && url.pathname === "/v1/articles") {
      return jsonResponse({ items: [{ id: "article-1" }] })
    }

    if (request.method === "POST" && url.pathname === "/v1/articles") {
      captured.body = JSON.parse(await request.text()) as unknown
      return jsonResponse({ id: "article-2" })
    }

    if (request.method === "PUT" && url.pathname === "/v1/articles/article-3") {
      captured.body = JSON.parse(await request.text()) as unknown
      return jsonResponse({ id: "article-3" })
    }

    return jsonResponse({ success: false, op: "mockApi", errorMessage: "Unexpected request" }, { status: 500 })
  })

  try {
    const list = await cliExecutableRun(
      ["article", "list", "--base-url", api.baseUrl, "--page", "2", "--type", "PRODUCT"],
      { environment: { LEXWARE_TOKEN: "environment-token", LEXWARE_ACCESS_TOKEN: "legacy-token" } },
    )
    expect(list.exitCode).toBe(0)
    expect(list.stderr).toBe("")
    expect(cliResultParse(list.stdout)).toEqual({ success: true, data: { items: [{ id: "article-1" }] } })

    const create = await cliExecutableRun(
      [
        "article",
        "create",
        "--base-url",
        api.baseUrl,
        "--access-token",
        "option-token",
        "--type",
        "PRODUCT",
        "--title",
        "Desk",
        "--leading-price",
        "NET",
        "--net-price",
        "10",
        "--tax-rate",
        "19",
      ],
      { environment: { LEXWARE_TOKEN: "environment-token" } },
    )
    expect(create.exitCode).toBe(0)
    expect(create.stderr).toBe("")
    expect(cliResultParse(create.stdout)).toEqual({ success: true, data: { id: "article-2" } })

    const update = await cliExecutableRun([
      "article",
      "update",
      "--base-url",
      api.baseUrl,
      "--access-token",
      "option-token",
      "--id",
      "article-3",
      "--type",
      "SERVICE",
      "--title",
      "Consulting",
      "--leading-price",
      "GROSS",
      "--gross-price",
      "12.5",
    ])
    expect(update.exitCode).toBe(0)
    expect(update.stderr).toBe("")
    expect(cliResultParse(update.stdout)).toEqual({ success: true, data: { id: "article-3" } })

    expect(api.requests).toHaveLength(3)
    expect(api.requests[0]).toMatchObject({
      authorization: "Bearer environment-token",
      method: "GET",
      path: "/v1/articles",
      query: { page: "2", type: "PRODUCT" },
    })
    expect(api.requests[1]).toMatchObject({
      authorization: "Bearer option-token",
      method: "POST",
      path: "/v1/articles",
      body: {
        title: "Desk",
        type: "PRODUCT",
        price: { leadingPrice: "NET", netPrice: 10, taxRate: 19 },
        version: 0,
      },
    })
    expect(api.requests[2]).toMatchObject({
      authorization: "Bearer option-token",
      method: "PUT",
      path: "/v1/articles/article-3",
      body: {
        title: "Consulting",
        type: "SERVICE",
        price: { leadingPrice: "GROSS", grossPrice: 12.5 },
      },
    })
  } finally {
    api.stop()
  }
})

test("CLI reports typed and assembled validation failures before calling the API", async () => {
  const api = mockApiStart(() => jsonResponse({ ok: true }))

  try {
    const typed = await cliExecutableRun([
      "article",
      "list",
      "--base-url",
      api.baseUrl,
      "--access-token",
      "token",
      "--page",
      "not-a-number",
    ])
    expect(typed.exitCode).not.toBe(0)
    expect(typed.stdout).toBe("")
    expect(cliResultParse(typed.stderr)).toMatchObject({ success: false, op: "cliArgumentParse" })

    const assembled = await cliExecutableRun([
      "article",
      "create",
      "--base-url",
      api.baseUrl,
      "--access-token",
      "token",
      "--type",
      "PRODUCT",
      "--net-price",
      "1",
    ])
    expect(assembled.exitCode).not.toBe(0)
    expect(assembled.stdout).toBe("")
    const assembledResult = cliResultParse(assembled.stderr)
    expect(assembledResult).toMatchObject({ success: false, op: "articleCreate" })
    expect(assembledResult.errorMessage).toContain("leadingPrice")
    expect(api.requests).toHaveLength(0)
  } finally {
    api.stop()
  }
})

test("CLI uses environment token fallbacks and rejects missing authentication", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "lexware-cli-token-"))
  const api = mockApiStart(() => jsonResponse({ countries: ["DE"] }))

  try {
    const legacy = await cliExecutableRun(["country", "list", "--base-url", api.baseUrl], {
      cwd,
      environment: { LEXWARE_ACCESS_TOKEN: "legacy-token" },
      unsetEnvironment: ["LEXWARE_TOKEN", "LEXWARE_API_KEY"],
    })
    expect(legacy.exitCode).toBe(0)
    expect(legacy.stderr).toBe("")
    expect(cliResultParse(legacy.stdout)).toEqual({ success: true, data: { countries: ["DE"] } })
    expect(api.requests[0]?.authorization).toBe("Bearer legacy-token")

    const missing = await cliExecutableRun(["country", "list", "--base-url", api.baseUrl], { cwd })
    expect(missing.exitCode).not.toBe(0)
    expect(missing.stdout).toBe("")
    expect(cliResultParse(missing.stderr)).toMatchObject({ success: false, op: "cliAccessTokenResolve" })
    expect(api.requests).toHaveLength(1)
  } finally {
    api.stop()
    await rm(cwd, { force: true, recursive: true })
  }
})

test("CLI loads default and selected environment files without overriding inherited values", async () => {
  const directory = await mkdtemp(join(tmpdir(), "lexware-cli-env-"))
  const envFilePath = join(directory, "selected.env")
  await writeFile(join(directory, ".env"), "LEXWARE_API_KEY=file-api-key\n")
  await writeFile(envFilePath, "LEXWARE_TOKEN=file-token\n")
  const api = mockApiStart(() => jsonResponse({ countries: ["DE"] }))

  try {
    const inherited = await cliExecutableRun(["country", "list", "--base-url", api.baseUrl], {
      cwd: directory,
      environment: { LEXWARE_API_KEY: "inherited-api-key" },
      unsetEnvironment: ["LEXWARE_TOKEN"],
    })
    expect(inherited.exitCode).toBe(0)
    expect(cliResultParse(inherited.stdout)).toEqual({ success: true, data: { countries: ["DE"] } })
    expect(api.requests[0]?.authorization).toBe("Bearer inherited-api-key")

    const selected = await cliExecutableRun(["--env-path", envFilePath, "country", "list", "--base-url", api.baseUrl], {
      cwd: directory,
      unsetEnvironment: ["LEXWARE_TOKEN", "LEXWARE_API_KEY"],
    })
    expect(selected.exitCode).toBe(0)
    expect(cliResultParse(selected.stdout)).toEqual({ success: true, data: { countries: ["DE"] } })
    expect(api.requests[1]?.authorization).toBe("Bearer file-token")

    const selectedAfterRoute = await cliExecutableRun(
      ["country", "list", "--base-url", api.baseUrl, `--env-path=${envFilePath}`],
      { cwd: directory, unsetEnvironment: ["LEXWARE_TOKEN", "LEXWARE_API_KEY"] },
    )
    expect(selectedAfterRoute.exitCode).toBe(0)
    expect(api.requests[2]?.authorization).toBe("Bearer file-token")

    const missing = await cliExecutableRun(["--env-path", join(directory, "missing.env"), "--help"], {
      cwd: directory,
    })
    expect(missing.exitCode).not.toBe(0)
    expect(missing.stdout).toBe("")
    expect(cliResultParse(missing.stderr)).toEqual({
      success: false,
      op: "cliEnvironmentLoad",
      errorMessage: `Unable to read environment file "${join(directory, "missing.env")}"`,
    })
  } finally {
    api.stop()
    await rm(directory, { force: true, recursive: true })
  }
})

test("CLI executes print-layout list command and outputs JSON", async () => {
  const api = mockApiStart(async (request, url) => {
    if (request.method === "GET" && url.pathname === "/v1/print-layouts") {
      return jsonResponse([{ id: "layout-1", name: "Default" }])
    }

    return jsonResponse({ success: false, op: "mockApi", errorMessage: "Unexpected request" }, { status: 500 })
  })

  try {
    const list = await cliExecutableRun([
      "print-layout",
      "list",
      "--base-url",
      api.baseUrl,
      "--access-token",
      "test-token",
    ])
    expect(list.exitCode).toBe(0)
    expect(list.stderr).toBe("")
    expect(cliResultParse(list.stdout)).toEqual({
      success: true,
      data: [{ id: "layout-1", name: "Default" }],
    })
    expect(api.requests).toHaveLength(1)
    expect(api.requests[0]).toMatchObject({
      authorization: "Bearer test-token",
      method: "GET",
      path: "/v1/print-layouts",
    })
  } finally {
    api.stop()
  }
})

test("CLI exposes and executes posting-categories list and profile get", async () => {
  const postingCategories = [
    {
      id: "posting-category-1",
      name: "Reise MA",
      type: "outgo",
      contactRequired: false,
      splitAllowed: true,
      groupName: "Reisen",
    },
  ]
  const profile = {
    organizationId: "organization-1",
    companyName: "Testfirma GmbH",
    created: {
      userId: "user-1",
      userName: "Erika Musterfrau",
      userEmail: "erika.musterfrau@example.org",
      date: "2026-08-26T12:00:00.000+02:00",
    },
    connectionId: "connection-1",
    businessFeatures: ["INVOICING"],
    taxType: "net",
    smallBusiness: false,
  }
  const api = mockApiStart(async (request, url) => {
    if (request.method === "GET" && url.pathname === "/v1/posting-categories") return jsonResponse(postingCategories)
    if (request.method === "GET" && url.pathname === "/v1/profile") return jsonResponse(profile)
    return jsonResponse({ success: false, op: "mockApi", errorMessage: "Unexpected request" }, { status: 500 })
  })

  const clientArgs = ["--base-url", api.baseUrl, "--access-token", "test-token"]

  try {
    const postingCategoryHelp = await cliExecutableRun(["posting-categories", "--help"])
    expect(postingCategoryHelp.exitCode).toBe(0)
    expect(postingCategoryHelp.stderr).toBe("")
    expect(postingCategoryHelp.stdout).toContain("list  List posting categories")

    const profileHelp = await cliExecutableRun(["profile", "--help"])
    expect(profileHelp.exitCode).toBe(0)
    expect(profileHelp.stderr).toBe("")
    expect(profileHelp.stdout).toContain("get  Get the profile")

    const postingCategoryList = await cliExecutableRun(["posting-categories", "list", ...clientArgs])
    expect(postingCategoryList.exitCode).toBe(0)
    expect(postingCategoryList.stderr).toBe("")
    expect(cliResultParse(postingCategoryList.stdout)).toEqual({ success: true, data: postingCategories })

    const profileGet = await cliExecutableRun(["profile", "get", ...clientArgs])
    expect(profileGet.exitCode).toBe(0)
    expect(profileGet.stderr).toBe("")
    expect(cliResultParse(profileGet.stdout)).toEqual({ success: true, data: profile })

    expect(api.requests).toEqual([
      { authorization: "Bearer test-token", method: "GET", path: "/v1/posting-categories", query: {} },
      { authorization: "Bearer test-token", method: "GET", path: "/v1/profile", query: {} },
    ])
  } finally {
    api.stop()
  }
})

test("CLI diagnostics and API errors stay JSON and use failure status codes", async () => {
  const frameworkCases = [
    { args: ["article", "unknown"], op: "cliCommandRoute" },
    { args: ["article", "list", "--unknown-option"], op: "cliArgumentParse" },
    { args: ["article", "get"], op: "cliArgumentParse" },
    { args: ["article", "list", "--page", "not-a-number"], op: "cliArgumentParse" },
    { args: ["article", "list", "1"], op: "cliArgumentParse" },
    { args: ["article", "list", '{"page":1}'], op: "cliArgumentParse" },
  ]

  for (const testCase of frameworkCases) {
    const result = await cliExecutableRun(testCase.args)
    expect(result.exitCode).not.toBe(0)
    expect(result.stdout).toBe("")
    const error = cliResultParse(result.stderr)
    expect(error).toMatchObject({ success: false, op: testCase.op })
    expect(error.errorMessage).toBeString()
  }

  const api = mockApiStart(() =>
    jsonResponse({ success: false, op: "mockApi", errorMessage: "Request rejected" }, { status: 422 }),
  )
  try {
    const result = await cliExecutableRun(["article", "list", "--base-url", api.baseUrl, "--access-token", "token"])
    expect(result.exitCode).not.toBe(0)
    expect(result.stdout).toBe("")
    expect(cliResultParse(result.stderr)).toEqual({
      success: false,
      op: "mockApi",
      errorMessage: "Request rejected",
      statusCode: 422,
    })
  } finally {
    api.stop()
  }
})

test("CLI uploads files and returns download metadata while writing bytes only when requested", async () => {
  const directory = await mkdtemp(join(tmpdir(), "lexware-cli-"))
  const uploadPath = join(directory, "upload.txt")
  const outputPath = join(directory, "download.bin")
  await writeFile(uploadPath, "upload contents")

  const api = mockApiStart(async (request, url, captured) => {
    if (request.method === "POST" && url.pathname === "/v1/files") {
      const form = await request.formData()
      const file = form.get("file")
      captured.body = {
        contents: file instanceof File ? await file.text() : null,
        filename: file instanceof File ? file.name : null,
        type: form.get("type"),
      }
      return jsonResponse({ id: "file-1" })
    }

    if (request.method === "GET" && url.pathname === "/v1/files/file-1") {
      return new Response(Uint8Array.from([0, 1, 2, 255]), {
        headers: {
          "Content-Disposition": 'attachment; filename="download.bin"',
          "Content-Type": "application/octet-stream",
        },
      })
    }

    return jsonResponse({ success: false, op: "mockApi", errorMessage: "Unexpected request" }, { status: 500 })
  })

  try {
    const upload = await cliExecutableRun([
      "file",
      "upload",
      "--base-url",
      api.baseUrl,
      "--access-token",
      "token",
      "--type",
      "TEXT",
      "--filename",
      "remote.txt",
      "--path",
      uploadPath,
    ])
    expect(upload.exitCode).toBe(0)
    expect(upload.stderr).toBe("")
    expect(cliResultParse(upload.stdout)).toEqual({ success: true, data: { id: "file-1" } })
    expect(api.requests[0]?.body).toEqual({ contents: "upload contents", filename: "remote.txt", type: "text" })

    const metadata = await cliExecutableRun([
      "file",
      "download",
      "--base-url",
      api.baseUrl,
      "--access-token",
      "token",
      "--id",
      "file-1",
    ])
    expect(metadata.exitCode).toBe(0)
    expect(metadata.stderr).toBe("")
    expect(cliResultParse(metadata.stdout)).toEqual({
      success: true,
      data: { filename: "download.bin", contentType: "application/octet-stream", byteLength: 4, output: null },
    })

    const download = await cliExecutableRun([
      "file",
      "download",
      "--base-url",
      api.baseUrl,
      "--access-token",
      "token",
      "--id",
      "file-1",
      "--output",
      outputPath,
    ])
    expect(download.exitCode).toBe(0)
    expect(download.stderr).toBe("")
    expect(cliResultParse(download.stdout)).toEqual({
      success: true,
      data: { filename: "download.bin", contentType: "application/octet-stream", byteLength: 4, output: outputPath },
    })
    expect(new Uint8Array(await readFile(outputPath))).toEqual(Uint8Array.from([0, 1, 2, 255]))
  } finally {
    api.stop()
    await rm(directory, { force: true, recursive: true })
  }
})

test("built package bin executes under the Node and Bun runtime matrix", async () => {
  expect(await Bun.file(builtCliPath).exists()).toBe(true)
  const directory = await mkdtemp(join(tmpdir(), "lexware-cli-runtime-"))
  const envPath = join(directory, "runtime.env")
  await writeFile(envPath, "LEXWARE_TOKEN=runtime-token\n")
  const api = mockApiStart(() => jsonResponse({ countries: ["DE"] }))

  try {
    for (const runtime of ["bun", "node"] as const) {
      const result = await cliExecutableRun(["--env-path", envPath, "country", "list", "--base-url", api.baseUrl], {
        cwd: directory,
        executable: builtCliPath,
        runtime,
        unsetEnvironment: ["LEXWARE_TOKEN"],
      })
      expect(result.exitCode).toBe(0)
      expect(result.stderr).toBe("")
      expect(cliResultParse(result.stdout)).toEqual({ success: true, data: { countries: ["DE"] } })
    }
    expect(api.requests.map((request) => request.authorization)).toEqual([
      "Bearer runtime-token",
      "Bearer runtime-token",
    ])
  } finally {
    api.stop()
    await rm(directory, { force: true, recursive: true })
  }
})

async function cliExecutableRun(args: readonly string[], options: CliRunOptions = {}): Promise<CliExecution> {
  const executable = options.executable ?? sourceCliPath
  const command = cliCommandCreate(executable, args, options.runtime)
  const environment: Record<string, string | undefined> = {
    ...process.env,
    LEXWARE_TOKEN: "",
    LEXWARE_API_KEY: "",
    LEXWARE_ACCESS_TOKEN: "",
    ...options.environment,
  }
  for (const variable of options.unsetEnvironment ?? []) delete environment[variable]

  const child = Bun.spawn(command, {
    cwd: options.cwd,
    env: environment,
    stderr: "pipe",
    stdout: "pipe",
  })

  const [stdout, stderr, exitCode] = await Promise.all([
    Bun.readableStreamToText(child.stdout),
    Bun.readableStreamToText(child.stderr),
    child.exited,
  ])

  return { exitCode, stderr, stdout }
}

function cliCommandCreate(executable: string, args: readonly string[], runtime?: CliRuntime): string[] {
  if (runtime === "bun") return [process.execPath, "--no-env-file", executable, ...args]
  if (runtime === "node") return ["node", executable, ...args]
  if (executable.endsWith(".ts")) return [process.execPath, "--no-env-file", executable, ...args]
  return [executable, ...args]
}

function cliResultParse(value: string): CliResult {
  return JSON.parse(value) as CliResult
}

function jsonResponse(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  })
}

function mockApiStart(handler: MockApiHandler): MockApi {
  const requests: MockApiRequest[] = []
  const server = Bun.serve({
    port: 0,
    async fetch(request) {
      const url = new URL(request.url)
      const captured: MockApiRequest = {
        authorization: request.headers.get("Authorization"),
        method: request.method,
        path: url.pathname,
        query: Object.fromEntries(url.searchParams.entries()),
      }
      requests.push(captured)
      return handler(request, url, captured)
    },
  })

  return {
    baseUrl: `http://127.0.0.1:${server.port}`,
    requests,
    stop: () => server.stop(),
  }
}
