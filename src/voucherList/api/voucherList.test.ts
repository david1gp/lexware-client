import { expect, test } from "bun:test"
import { lexwareTestClient } from "../../shared/lexwareTestClient.test.js"
import { voucherListList } from "./voucherListList.js"

test("voucherListList builds official filters and paging query", async () => {
  const { client, calls } = lexwareTestClient()
  const result = await voucherListList(client, {
    page: 0,
    size: 250,
    voucherType: "purchaseinvoice,invoice",
    voucherStatus: "open",
    archived: false,
    contactId: "777c7793-9fbb-4ec7-9254-0619c199761e",
    voucherDateFrom: "2023-03-01",
    voucherDateTo: "2023-03-31",
    createdDateFrom: "2023-03-01",
    createdDateTo: "2023-03-31",
    updatedDateFrom: "2023-03-01",
    updatedDateTo: "2023-03-31",
    voucherNumber: "R&1",
    sort: "voucherDate,DESC",
  })
  expect(result.success).toBe(true)
  expect(String(calls[0]?.input)).toBe(
    "https://api.lexware.io/v1/voucherlist?page=0&size=250&voucherType=purchaseinvoice%2Cinvoice&voucherStatus=open&archived=false&contactId=777c7793-9fbb-4ec7-9254-0619c199761e&voucherDateFrom=2023-03-01&voucherDateTo=2023-03-31&createdDateFrom=2023-03-01&createdDateTo=2023-03-31&updatedDateFrom=2023-03-01&updatedDateTo=2023-03-31&voucherNumber=R%261&sort=voucherDate%2CDESC",
  )
})

test("voucherListList validates required filters and filter values", async () => {
  const { client, calls } = lexwareTestClient()
  const missingRequiredFilters = await voucherListList(client, {} as never)
  const invalidStatus = await voucherListList(client, { voucherType: "any", voucherStatus: "overdue,open" })
  const invalidDate = await voucherListList(client, {
    voucherType: "any",
    voucherStatus: "any",
    voucherDateFrom: "not-a-date",
  })
  const invalidSort = await voucherListList(client, { voucherType: "any", voucherStatus: "any", sort: "id" } as never)

  expect(missingRequiredFilters.success).toBe(false)
  expect(invalidStatus.success).toBe(false)
  expect(invalidDate.success).toBe(false)
  expect(invalidSort.success).toBe(false)
  expect(calls).toHaveLength(0)
})
