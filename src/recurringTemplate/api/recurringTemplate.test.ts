import { expect, test } from "bun:test"
import { lexwareJsonResponse, lexwareTestClient } from "../../shared/lexwareTestClient.test.js"
import { recurringTemplateGet } from "./recurringTemplateGet.js"
import { recurringTemplateList } from "./recurringTemplateList.js"

const recurringTemplate = {
  id: "template-id",
  organizationId: "organization-id",
  createdDate: "2026-01-01T12:00:00.000+01:00",
  updatedDate: "2026-01-01T12:00:00.000+01:00",
  version: 0,
  language: "de",
  archived: false,
  address: {
    contactId: "contact-id",
    name: "Example GmbH",
    street: "Example Street 1",
    city: "Freiburg",
    zip: "79111",
    countryCode: "DE",
  },
  lineItems: [
    {
      type: "custom",
      name: "Consulting",
      quantity: 1,
      unitName: "hour",
      unitPrice: { currency: "EUR", netAmount: 100, grossAmount: 119, taxRatePercentage: 19 },
      discountPercentage: 0,
      lineItemAmount: 100,
    },
  ],
  totalPrice: { currency: "EUR", totalNetAmount: 100, totalGrossAmount: 119, totalTaxAmount: 19 },
  taxAmounts: [{ taxRatePercentage: 19, taxAmount: 19, netAmount: 100 }],
  taxConditions: { taxType: "net" },
  paymentConditions: {
    paymentTermLabel: "Payable immediately",
    paymentTermLabelTemplate: "Payable immediately",
    paymentTermDuration: 0,
  },
  title: "Invoice",
  recurringTemplateSettings: {
    id: "settings-id",
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

const recurringTemplateListItem = {
  id: recurringTemplate.id,
  organizationId: recurringTemplate.organizationId,
  title: recurringTemplate.title,
  createdDate: recurringTemplate.createdDate,
  updatedDate: recurringTemplate.updatedDate,
  address: { contactId: "contact-id", name: "Example GmbH" },
  totalPrice: { currency: "EUR", totalNetAmount: 100, totalGrossAmount: 119 },
  paymentConditions: recurringTemplate.paymentConditions,
  recurringTemplateSettings: recurringTemplate.recurringTemplateSettings,
}

const page = {
  content: [recurringTemplateListItem],
  first: true,
  last: true,
  totalPages: 1,
  totalElements: 1,
  numberOfElements: 1,
  size: 25,
  number: 0,
  sort: [{ property: "createdDate", direction: "DESC", ignoreCase: false, nullHandling: "NATIVE", ascending: false }],
}

test("recurringTemplateGet encodes the template id and parses the response", async () => {
  const { client, calls } = lexwareTestClient([lexwareJsonResponse(recurringTemplate)])
  const result = await recurringTemplateGet(client, "template/id")
  expect(result.success).toBe(true)
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/recurring-templates/template%2Fid")
  expect(calls[0]?.init?.method).toBe("GET")
})

test("recurringTemplateList sends official paging and sorting queries", async () => {
  const { client, calls } = lexwareTestClient([lexwareJsonResponse(page)])
  const result = await recurringTemplateList(client, { page: 2, size: 10, sort: "createdDate,DESC" })
  expect(result.success).toBe(true)
  expect(String(calls[0]?.input)).toBe(
    "https://api.lexware.io/v1/recurring-templates?page=2&size=10&sort=createdDate%2CDESC",
  )
  expect(calls[0]?.init?.method).toBe("GET")
})

test("recurringTemplateList rejects unsupported sorting and invalid responses", async () => {
  const { client, calls } = lexwareTestClient()
  const invalidSort = await recurringTemplateList(client, { sort: "title,DESC" } as never)
  expect(invalidSort.success).toBe(false)
  expect(calls).toHaveLength(0)

  const invalidResponseClient = lexwareTestClient([lexwareJsonResponse({ content: [] })]).client
  const invalidResponse = await recurringTemplateList(invalidResponseClient)
  expect(invalidResponse.success).toBe(false)
})
