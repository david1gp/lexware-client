import { expect, test } from "bun:test"
import * as a from "valibot"
import {
  contactAddressesSchema,
  contactCompanyCreateInputSchema,
  contactEmailAddressesSchema,
  contactNoteSchema,
  contactPhoneNumbersSchema,
  contactUpdateBodySchema,
  contactXRechnungSchema,
} from "./contactSchemas.js"

test("contact request schemas keep contact cross-field rules", () => {
  expect(
    a.safeParse(contactCompanyCreateInputSchema, {
      roles: {},
      company: { name: "ACME" },
    }).success,
  ).toBe(false)
  expect(
    a.safeParse(contactCompanyCreateInputSchema, {
      roles: { customer: "yes" },
      company: { name: "ACME" },
    }).success,
  ).toBe(false)

  expect(
    a.safeParse(contactCompanyCreateInputSchema, {
      roles: { customer: {} },
      company: { name: "ACME", contactPersons: [{ firstName: "Ada" }] },
    }).success,
  ).toBe(false)

  expect(
    a.safeParse(contactCompanyCreateInputSchema, {
      roles: { customer: {} },
      company: { name: "ACME" },
      addresses: { billing: [{ city: "Berlin" }] },
    }).success,
  ).toBe(false)

  expect(a.safeParse(contactXRechnungSchema, { buyerReference: "buyer" }).success).toBe(false)
  expect(a.safeParse(contactAddressesSchema, { billing: [{ countryCode: "DE" }, { countryCode: "DE" }] }).success).toBe(
    false,
  )
  expect(a.safeParse(contactAddressesSchema, { billing: [{ countryCode: "de" }] }).success).toBe(false)
  expect(a.safeParse(contactAddressesSchema, { billing: [{ countryCode: "DEU" }] }).success).toBe(false)
  expect(a.safeParse(contactEmailAddressesSchema, { business: ["one", "two"] }).success).toBe(false)
  expect(a.safeParse(contactPhoneNumbersSchema, { mobile: ["one", "two"] }).success).toBe(false)
  expect(a.safeParse(contactNoteSchema, "x".repeat(1001)).success).toBe(false)
  expect(
    a.safeParse(contactUpdateBodySchema, {
      roles: { customer: {} },
    }).success,
  ).toBe(true)
  expect(a.safeParse(contactUpdateBodySchema, { version: 3 }).success).toBe(false)
  const partialUpdate = {
    roles: { customer: {} },
    company: { taxNumber: "123", futureCompanyField: true },
    person: { firstName: "Ada" },
    futureField: { enabled: true },
  }
  const partialUpdateResult = a.safeParse(contactUpdateBodySchema, partialUpdate)
  expect(partialUpdateResult.success).toBe(true)
  if (!partialUpdateResult.success) return
  expect(partialUpdateResult.output).toEqual(partialUpdate)
  expect(a.safeParse(contactUpdateBodySchema, { version: "3" }).success).toBe(false)
  expect(a.safeParse(contactUpdateBodySchema, { roles: {} }).success).toBe(false)
  expect(a.safeParse(contactUpdateBodySchema, { company: { taxNumber: 123 } }).success).toBe(false)
})
