import * as a from "valibot"
import {
  lexwareCountryCodeSchema,
  lexwareIdInputSchema,
  lexwareNonNegativeIntegerSchema,
} from "../../shared/lexwareSchemas.js"

const contactRoleEntries = {
  customer: a.optional(a.object({})),
  vendor: a.optional(a.object({})),
} as const

export const contactRoleSchema = a.pipe(
  a.looseObject(contactRoleEntries),
  a.check(
    (input) => input.customer !== undefined || input.vendor !== undefined,
    "At least one contact role is required",
  ),
)

const contactCompanyContactPersonEntries = {
  salutation: a.optional(a.string()),
  firstName: a.optional(a.string()),
  lastName: a.pipe(a.string(), a.minLength(1)),
  primary: a.optional(a.boolean()),
  emailAddress: a.optional(a.string()),
  phoneNumber: a.optional(a.string()),
} as const

export const contactCompanyContactPersonSchema = a.looseObject(contactCompanyContactPersonEntries)

const contactCompanyEntries = {
  name: a.pipe(a.string(), a.minLength(1)),
  taxNumber: a.optional(a.string()),
  vatRegistrationId: a.optional(a.string()),
  allowTaxFreeInvoices: a.optional(a.boolean()),
  contactPersons: a.optional(a.pipe(a.array(contactCompanyContactPersonSchema), a.maxLength(1))),
} as const

export const contactCompanySchema = a.looseObject(contactCompanyEntries)

const contactPersonEntries = {
  salutation: a.optional(a.string()),
  firstName: a.pipe(a.string(), a.minLength(1)),
  lastName: a.pipe(a.string(), a.minLength(1)),
} as const

export const contactPersonSchema = a.looseObject(contactPersonEntries)

const contactAddressEntries = {
  supplement: a.optional(a.string()),
  street: a.optional(a.string()),
  zip: a.optional(a.string()),
  city: a.optional(a.string()),
  countryCode: lexwareCountryCodeSchema,
} as const

export const contactAddressSchema = a.looseObject(contactAddressEntries)

export const contactAddressesSchema = a.looseObject({
  billing: a.optional(a.pipe(a.array(contactAddressSchema), a.maxLength(1))),
  shipping: a.optional(a.pipe(a.array(contactAddressSchema), a.maxLength(1))),
})

export const contactXRechnungBuyerReferenceSchema = a.string()
export const contactXRechnungVendorNumberAtCustomerSchema = a.string()

const contactXRechnungFieldsSchema = a.looseObject({
  buyerReference: a.optional(contactXRechnungBuyerReferenceSchema),
  vendorNumberAtCustomer: a.optional(contactXRechnungVendorNumberAtCustomerSchema),
})

export const contactXRechnungSchema = a.pipe(
  contactXRechnungFieldsSchema,
  a.check(
    (input) =>
      (input.buyerReference === undefined && input.vendorNumberAtCustomer === undefined) ||
      (input.buyerReference !== undefined && input.vendorNumberAtCustomer !== undefined),
    "XRechnung buyer reference and vendor number must be provided together",
  ),
)

export const contactEmailAddressSchema = a.string()

export const contactEmailAddressesSchema = a.looseObject({
  business: a.optional(a.pipe(a.array(contactEmailAddressSchema), a.maxLength(1))),
  office: a.optional(a.pipe(a.array(contactEmailAddressSchema), a.maxLength(1))),
  private: a.optional(a.pipe(a.array(contactEmailAddressSchema), a.maxLength(1))),
  other: a.optional(a.pipe(a.array(contactEmailAddressSchema), a.maxLength(1))),
})

export const contactPhoneNumberSchema = a.string()

export const contactPhoneNumbersSchema = a.looseObject({
  business: a.optional(a.pipe(a.array(contactPhoneNumberSchema), a.maxLength(1))),
  office: a.optional(a.pipe(a.array(contactPhoneNumberSchema), a.maxLength(1))),
  mobile: a.optional(a.pipe(a.array(contactPhoneNumberSchema), a.maxLength(1))),
  private: a.optional(a.pipe(a.array(contactPhoneNumberSchema), a.maxLength(1))),
  fax: a.optional(a.pipe(a.array(contactPhoneNumberSchema), a.maxLength(1))),
  other: a.optional(a.pipe(a.array(contactPhoneNumberSchema), a.maxLength(1))),
})

export const contactNoteSchema = a.pipe(a.string(), a.maxLength(1000))

const contactBodyEntries = {
  roles: contactRoleSchema,
  company: a.optional(contactCompanySchema),
  person: a.optional(contactPersonSchema),
  addresses: a.optional(contactAddressesSchema),
  xRechnung: a.optional(contactXRechnungSchema),
  emailAddresses: a.optional(contactEmailAddressesSchema),
  phoneNumbers: a.optional(contactPhoneNumbersSchema),
  note: a.optional(contactNoteSchema),
  archived: a.optional(a.boolean()),
  version: a.optional(a.number()),
} as const

export const contactBodySchema = a.looseObject(contactBodyEntries)

export const contactCompanyBodySchema = a.looseObject({
  ...contactBodyEntries,
  company: contactCompanySchema,
})

export const contactPersonBodySchema = a.looseObject({
  ...contactBodyEntries,
  person: contactPersonSchema,
})

const contactUpdateBodyEntries = {
  ...contactBodyEntries,
  roles: contactRoleSchema,
  company: a.optional(
    a.looseObject({
      ...a.partial(contactCompanySchema).entries,
      contactPersons: a.optional(a.pipe(a.array(a.partial(contactCompanyContactPersonSchema)), a.maxLength(1))),
    }),
  ),
  person: a.optional(a.partial(contactPersonSchema)),
  addresses: a.optional(
    a.looseObject({
      billing: a.optional(a.pipe(a.array(a.partial(contactAddressSchema)), a.maxLength(1))),
      shipping: a.optional(a.pipe(a.array(a.partial(contactAddressSchema)), a.maxLength(1))),
    }),
  ),
  xRechnung: a.optional(contactXRechnungFieldsSchema),
} as const

export const contactUpdateBodySchema = a.looseObject(contactUpdateBodyEntries)

export const contactCompanyCreateInputSchema = contactCompanyBodySchema
export const contactPersonCreateInputSchema = contactPersonBodySchema

export const contactUpdateInputSchema = a.object({
  id: lexwareIdInputSchema.entries.id,
  body: contactUpdateBodySchema,
})

export const contactListInputSchema = a.object({
  page: a.optional(lexwareNonNegativeIntegerSchema),
  size: a.optional(a.pipe(lexwareNonNegativeIntegerSchema, a.minValue(1), a.maxValue(250))),
  email: a.optional(a.pipe(a.string(), a.minLength(3))),
  name: a.optional(a.pipe(a.string(), a.minLength(3))),
  number: a.optional(a.pipe(a.number(), a.integer())),
  customer: a.optional(a.boolean()),
  vendor: a.optional(a.boolean()),
})

export type ContactBody = a.InferOutput<typeof contactBodySchema>
export type ContactCompanyBody = a.InferOutput<typeof contactCompanyBodySchema>
export type ContactCompanyCreateInput = a.InferOutput<typeof contactCompanyCreateInputSchema>
export type ContactPersonCreateInput = a.InferOutput<typeof contactPersonCreateInputSchema>
export type ContactPersonBody = a.InferOutput<typeof contactPersonBodySchema>
export type ContactUpdateBody = a.InferOutput<typeof contactUpdateBodySchema>
export type ContactUpdateInput = a.InferOutput<typeof contactUpdateInputSchema>
export type ContactListInput = a.InferOutput<typeof contactListInputSchema>
