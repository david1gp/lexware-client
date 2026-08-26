import { expect, test } from "bun:test"
import { lexwareRequestBodyJson, lexwareTestClient } from "../../shared/lexwareTestClient.test.js"
import { contactCompanyCreate } from "./contactCompanyCreate.js"
import { contactList } from "./contactList.js"
import { contactUpdate } from "./contactUpdate.js"

test("contactCompanyCreate posts to contacts", async () => {
  const { client, calls } = lexwareTestClient()
  await contactCompanyCreate(client, {
    roles: { customer: {} },
    company: { name: "ACME" },
  })
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/contacts")
  expect(calls[0]?.init?.method).toBe("POST")
  expect(await lexwareRequestBodyJson(calls[0]!)).toEqual({
    roles: { customer: {} },
    company: { name: "ACME" },
  })
})

test("contactList builds filters", async () => {
  const { client, calls } = lexwareTestClient()
  const result = await contactList(client, {
    page: 0,
    size: 250,
    email: "johnson & partner",
    name: "A_b%",
    number: 123,
    customer: false,
    vendor: true,
  })
  expect(result.success).toBe(true)
  expect(String(calls[0]?.input)).toBe(
    "https://api.lexware.io/v1/contacts?page=0&size=250&email=johnson+%26+partner&name=A_b%25&number=123&customer=false&vendor=true",
  )
})

test("contactList validates official filter rules", async () => {
  const { client, calls } = lexwareTestClient()
  const invalidEmail = await contactList(client, { email: "ab" })
  const invalidName = await contactList(client, { name: "ab" })
  const invalidNumber = await contactList(client, { number: 1.5 })

  expect(invalidEmail.success).toBe(false)
  expect(invalidName.success).toBe(false)
  expect(invalidNumber.success).toBe(false)
  expect(calls).toHaveLength(0)
})

test("contactUpdate validates its body before sending", async () => {
  const { client, calls } = lexwareTestClient()
  const invalid = await contactUpdate(client, "contact-1", { version: "1" })
  expect(invalid.success).toBe(false)
  expect(calls).toHaveLength(0)

  const valid = await contactUpdate(client, "contact-1", {
    roles: { customer: {} },
    version: 3,
    futureField: { enabled: true },
  })
  expect(valid.success).toBe(true)
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/contacts/contact-1")
  expect(calls[0]?.init?.method).toBe("PUT")
  expect(await lexwareRequestBodyJson(calls[0]!)).toEqual({
    roles: { customer: {} },
    version: 3,
    futureField: { enabled: true },
  })
})
