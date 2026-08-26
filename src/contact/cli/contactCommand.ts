import { buildCommand, buildRouteMap } from "@stricli/core"
import * as a from "valibot"
import type { CliClientInput } from "../../cli/cliClientCreate.js"
import { cliClientOptions } from "../../cli/cliClientOptions.js"
import type { CliCommandContext } from "../../cli/cliCommandContext.js"
import { cliCommandExecute } from "../../cli/cliCommandExecute.js"
import { cliOptionCreate } from "../../cli/cliOptionCreate.js"
import { cliOptionSchemas } from "../../cli/cliOptionSchemas.js"
import { lexwareIdInputSchema } from "../../shared/lexwareSchemas.js"
import { contactCompanyCreate } from "../api/contactCompanyCreate.js"
import { contactGet } from "../api/contactGet.js"
import { contactList } from "../api/contactList.js"
import { contactPersonCreate } from "../api/contactPersonCreate.js"
import { contactUpdate } from "../api/contactUpdate.js"
import {
  contactAddressSchema,
  contactBodySchema,
  contactCompanyContactPersonSchema,
  contactCompanyCreateInputSchema,
  contactCompanySchema,
  contactEmailAddressSchema,
  contactListInputSchema,
  contactNoteSchema,
  contactPersonCreateInputSchema,
  contactPersonSchema,
  contactPhoneNumberSchema,
  contactUpdateInputSchema,
  contactXRechnungBuyerReferenceSchema,
  contactXRechnungVendorNumberAtCustomerSchema,
} from "../schema/contactSchemas.js"

type ContactCommonFlags = CliClientInput & {
  readonly customer?: a.InferOutput<typeof cliOptionSchemas.boolean>
  readonly vendor?: a.InferOutput<typeof cliOptionSchemas.boolean>
  readonly billingSupplement?: a.InferOutput<typeof contactAddressSchema.entries.supplement>
  readonly billingStreet?: a.InferOutput<typeof contactAddressSchema.entries.street>
  readonly billingZip?: a.InferOutput<typeof contactAddressSchema.entries.zip>
  readonly billingCity?: a.InferOutput<typeof contactAddressSchema.entries.city>
  readonly billingCountryCode?: a.InferOutput<typeof contactAddressSchema.entries.countryCode>
  readonly shippingSupplement?: a.InferOutput<typeof contactAddressSchema.entries.supplement>
  readonly shippingStreet?: a.InferOutput<typeof contactAddressSchema.entries.street>
  readonly shippingZip?: a.InferOutput<typeof contactAddressSchema.entries.zip>
  readonly shippingCity?: a.InferOutput<typeof contactAddressSchema.entries.city>
  readonly shippingCountryCode?: a.InferOutput<typeof contactAddressSchema.entries.countryCode>
  readonly xRechnungBuyerReference?: a.InferOutput<typeof contactXRechnungBuyerReferenceSchema>
  readonly xRechnungVendorNumberAtCustomer?: a.InferOutput<typeof contactXRechnungVendorNumberAtCustomerSchema>
  readonly emailBusiness?: a.InferOutput<typeof contactEmailAddressSchema>
  readonly emailOffice?: a.InferOutput<typeof contactEmailAddressSchema>
  readonly emailPrivate?: a.InferOutput<typeof contactEmailAddressSchema>
  readonly emailOther?: a.InferOutput<typeof contactEmailAddressSchema>
  readonly phoneBusiness?: a.InferOutput<typeof contactPhoneNumberSchema>
  readonly phoneOffice?: a.InferOutput<typeof contactPhoneNumberSchema>
  readonly phoneMobile?: a.InferOutput<typeof contactPhoneNumberSchema>
  readonly phonePrivate?: a.InferOutput<typeof contactPhoneNumberSchema>
  readonly phoneFax?: a.InferOutput<typeof contactPhoneNumberSchema>
  readonly phoneOther?: a.InferOutput<typeof contactPhoneNumberSchema>
  readonly note?: a.InferOutput<typeof contactNoteSchema>
  readonly archived?: a.InferOutput<typeof contactBodySchema.entries.archived>
  readonly version?: a.InferOutput<typeof contactBodySchema.entries.version>
}

type ContactCompanyFields = {
  readonly companyName?: a.InferOutput<typeof contactCompanySchema.entries.name>
  readonly companyTaxNumber?: a.InferOutput<typeof contactCompanySchema.entries.taxNumber>
  readonly companyVatRegistrationId?: a.InferOutput<typeof contactCompanySchema.entries.vatRegistrationId>
  readonly companyAllowTaxFreeInvoices?: a.InferOutput<typeof contactCompanySchema.entries.allowTaxFreeInvoices>
  readonly contactPersonSalutation?: a.InferOutput<typeof contactCompanyContactPersonSchema.entries.salutation>
  readonly contactPersonFirstName?: a.InferOutput<typeof contactCompanyContactPersonSchema.entries.firstName>
  readonly contactPersonLastName?: a.InferOutput<typeof contactCompanyContactPersonSchema.entries.lastName>
  readonly contactPersonPrimary?: a.InferOutput<typeof contactCompanyContactPersonSchema.entries.primary>
  readonly contactPersonEmailAddress?: a.InferOutput<typeof contactCompanyContactPersonSchema.entries.emailAddress>
  readonly contactPersonPhoneNumber?: a.InferOutput<typeof contactCompanyContactPersonSchema.entries.phoneNumber>
}

type ContactPersonFields = {
  readonly personSalutation?: a.InferOutput<typeof contactPersonSchema.entries.salutation>
  readonly personFirstName?: a.InferOutput<typeof contactPersonSchema.entries.firstName>
  readonly personLastName?: a.InferOutput<typeof contactPersonSchema.entries.lastName>
}

type ContactBodyFlags = ContactCommonFlags & ContactCompanyFields & ContactPersonFields

type ContactBodyInputOptions = {
  readonly omitEmptyRoles?: boolean
}

type ContactCompanyCreateFlags = ContactCommonFlags &
  ContactCompanyFields & {
    readonly companyName: a.InferOutput<typeof contactCompanySchema.entries.name>
  }

type ContactPersonCreateFlags = ContactCommonFlags &
  ContactPersonFields & {
    readonly personFirstName: a.InferOutput<typeof contactPersonSchema.entries.firstName>
    readonly personLastName: a.InferOutput<typeof contactPersonSchema.entries.lastName>
  }

type ContactUpdateFlags = ContactCommonFlags &
  ContactCompanyFields &
  ContactPersonFields & {
    readonly id: a.InferOutput<typeof lexwareIdInputSchema.entries.id>
  }

const contactCommonOptions = {
  customer: cliOptionCreate(cliOptionSchemas.boolean, "Add the customer role", { optional: true }),
  vendor: cliOptionCreate(cliOptionSchemas.boolean, "Add the vendor role", { optional: true }),
  billingSupplement: cliOptionCreate(a.unwrap(contactAddressSchema.entries.supplement), "Billing address supplement", {
    optional: true,
  }),
  billingStreet: cliOptionCreate(a.unwrap(contactAddressSchema.entries.street), "Billing street and number", {
    optional: true,
  }),
  billingZip: cliOptionCreate(a.unwrap(contactAddressSchema.entries.zip), "Billing postal code", { optional: true }),
  billingCity: cliOptionCreate(a.unwrap(contactAddressSchema.entries.city), "Billing city", { optional: true }),
  billingCountryCode: cliOptionCreate(
    contactAddressSchema.entries.countryCode,
    "Billing ISO 3166 alpha-2 country code",
    {
      optional: true,
    },
  ),
  shippingSupplement: cliOptionCreate(
    a.unwrap(contactAddressSchema.entries.supplement),
    "Shipping address supplement",
    { optional: true },
  ),
  shippingStreet: cliOptionCreate(a.unwrap(contactAddressSchema.entries.street), "Shipping street and number", {
    optional: true,
  }),
  shippingZip: cliOptionCreate(a.unwrap(contactAddressSchema.entries.zip), "Shipping postal code", { optional: true }),
  shippingCity: cliOptionCreate(a.unwrap(contactAddressSchema.entries.city), "Shipping city", { optional: true }),
  shippingCountryCode: cliOptionCreate(
    contactAddressSchema.entries.countryCode,
    "Shipping ISO 3166 alpha-2 country code",
    {
      optional: true,
    },
  ),
  xRechnungBuyerReference: cliOptionCreate(contactXRechnungBuyerReferenceSchema, "XRechnung buyer reference", {
    optional: true,
  }),
  xRechnungVendorNumberAtCustomer: cliOptionCreate(
    contactXRechnungVendorNumberAtCustomerSchema,
    "Vendor number at customer",
    { optional: true },
  ),
  emailBusiness: cliOptionCreate(contactEmailAddressSchema, "Business email address", { optional: true }),
  emailOffice: cliOptionCreate(contactEmailAddressSchema, "Office email address", { optional: true }),
  emailPrivate: cliOptionCreate(contactEmailAddressSchema, "Private email address", { optional: true }),
  emailOther: cliOptionCreate(contactEmailAddressSchema, "Other email address", { optional: true }),
  phoneBusiness: cliOptionCreate(contactPhoneNumberSchema, "Business phone number", { optional: true }),
  phoneOffice: cliOptionCreate(contactPhoneNumberSchema, "Office phone number", { optional: true }),
  phoneMobile: cliOptionCreate(contactPhoneNumberSchema, "Mobile phone number", { optional: true }),
  phonePrivate: cliOptionCreate(contactPhoneNumberSchema, "Private phone number", { optional: true }),
  phoneFax: cliOptionCreate(contactPhoneNumberSchema, "Fax number", { optional: true }),
  phoneOther: cliOptionCreate(contactPhoneNumberSchema, "Other phone number", { optional: true }),
  note: cliOptionCreate(contactNoteSchema, "Contact note", { optional: true }),
  archived: cliOptionCreate(
    a.pipe(cliOptionSchemas.boolean, a.unwrap(contactBodySchema.entries.archived)),
    "Archived contact flag",
    { optional: true },
  ),
  version: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(contactBodySchema.entries.version)),
    "Contact version",
    { optional: true },
  ),
} as const

const contactCompanyOptions = {
  companyName: cliOptionCreate(contactCompanySchema.entries.name, "Company name"),
  companyTaxNumber: cliOptionCreate(a.unwrap(contactCompanySchema.entries.taxNumber), "Company tax number", {
    optional: true,
  }),
  companyVatRegistrationId: cliOptionCreate(
    a.unwrap(contactCompanySchema.entries.vatRegistrationId),
    "Company VAT registration ID",
    { optional: true },
  ),
  companyAllowTaxFreeInvoices: cliOptionCreate(
    a.pipe(cliOptionSchemas.boolean, a.unwrap(contactCompanySchema.entries.allowTaxFreeInvoices)),
    "Allow tax-free invoices",
    { optional: true },
  ),
  contactPersonSalutation: cliOptionCreate(
    a.unwrap(contactCompanyContactPersonSchema.entries.salutation),
    "Company contact person salutation",
    { optional: true },
  ),
  contactPersonFirstName: cliOptionCreate(
    a.unwrap(contactCompanyContactPersonSchema.entries.firstName),
    "Company contact person first name",
    {
      optional: true,
    },
  ),
  contactPersonLastName: cliOptionCreate(
    contactCompanyContactPersonSchema.entries.lastName,
    "Company contact person last name",
    {
      optional: true,
    },
  ),
  contactPersonPrimary: cliOptionCreate(
    a.pipe(cliOptionSchemas.boolean, a.unwrap(contactCompanyContactPersonSchema.entries.primary)),
    "Company contact person is primary",
    {
      optional: true,
    },
  ),
  contactPersonEmailAddress: cliOptionCreate(
    a.unwrap(contactCompanyContactPersonSchema.entries.emailAddress),
    "Company contact person email address",
    {
      optional: true,
    },
  ),
  contactPersonPhoneNumber: cliOptionCreate(
    a.unwrap(contactCompanyContactPersonSchema.entries.phoneNumber),
    "Company contact person phone number",
    {
      optional: true,
    },
  ),
} as const

const contactPersonOptions = {
  personSalutation: cliOptionCreate(a.unwrap(contactPersonSchema.entries.salutation), "Person salutation", {
    optional: true,
  }),
  personFirstName: cliOptionCreate(contactPersonSchema.entries.firstName, "Person first name", { optional: true }),
  personLastName: cliOptionCreate(contactPersonSchema.entries.lastName, "Person last name", { optional: true }),
} as const

const contactCompanyUpdateOptions = {
  ...contactCompanyOptions,
  companyName: cliOptionCreate(contactCompanySchema.entries.name, "Company name", { optional: true }),
} as const

const contactPersonCreateOptions = {
  ...contactPersonOptions,
  personFirstName: cliOptionCreate(contactPersonSchema.entries.firstName, "Person first name"),
  personLastName: cliOptionCreate(contactPersonSchema.entries.lastName, "Person last name"),
} as const

function contactAddressFromFlags(
  supplement: string | undefined,
  street: string | undefined,
  zip: string | undefined,
  city: string | undefined,
  countryCode: string | undefined,
):
  | {
      readonly city: string | undefined
      readonly countryCode: string | undefined
      readonly street: string | undefined
      readonly supplement: string | undefined
      readonly zip: string | undefined
    }
  | undefined {
  if (
    supplement === undefined &&
    street === undefined &&
    zip === undefined &&
    city === undefined &&
    countryCode === undefined
  ) {
    return undefined
  }

  return { supplement, street, zip, city, countryCode }
}

function contactCompanyContactPersonFromFlags(flags: ContactBodyFlags):
  | {
      readonly emailAddress: string | undefined
      readonly firstName: string | undefined
      readonly lastName: string | undefined
      readonly phoneNumber: string | undefined
      readonly primary: boolean | undefined
      readonly salutation: string | undefined
    }[]
  | undefined {
  if (
    flags.contactPersonSalutation === undefined &&
    flags.contactPersonFirstName === undefined &&
    flags.contactPersonLastName === undefined &&
    flags.contactPersonPrimary === undefined &&
    flags.contactPersonEmailAddress === undefined &&
    flags.contactPersonPhoneNumber === undefined
  ) {
    return undefined
  }

  return [
    {
      salutation: flags.contactPersonSalutation,
      firstName: flags.contactPersonFirstName,
      lastName: flags.contactPersonLastName,
      primary: flags.contactPersonPrimary,
      emailAddress: flags.contactPersonEmailAddress,
      phoneNumber: flags.contactPersonPhoneNumber,
    },
  ]
}

function contactBodyInputFromFlags(flags: ContactBodyFlags, options: ContactBodyInputOptions = {}): unknown {
  const billing = contactAddressFromFlags(
    flags.billingSupplement,
    flags.billingStreet,
    flags.billingZip,
    flags.billingCity,
    flags.billingCountryCode,
  )
  const shipping = contactAddressFromFlags(
    flags.shippingSupplement,
    flags.shippingStreet,
    flags.shippingZip,
    flags.shippingCity,
    flags.shippingCountryCode,
  )
  const hasCompany =
    flags.companyName !== undefined ||
    flags.companyTaxNumber !== undefined ||
    flags.companyVatRegistrationId !== undefined ||
    flags.companyAllowTaxFreeInvoices !== undefined ||
    contactCompanyContactPersonFromFlags(flags) !== undefined
  const hasPerson =
    flags.personSalutation !== undefined || flags.personFirstName !== undefined || flags.personLastName !== undefined
  const hasXRechnung =
    flags.xRechnungBuyerReference !== undefined || flags.xRechnungVendorNumberAtCustomer !== undefined
  const hasEmailAddresses =
    flags.emailBusiness !== undefined ||
    flags.emailOffice !== undefined ||
    flags.emailPrivate !== undefined ||
    flags.emailOther !== undefined
  const hasPhoneNumbers =
    flags.phoneBusiness !== undefined ||
    flags.phoneOffice !== undefined ||
    flags.phoneMobile !== undefined ||
    flags.phonePrivate !== undefined ||
    flags.phoneFax !== undefined ||
    flags.phoneOther !== undefined
  const hasRoles = flags.customer === true || flags.vendor === true

  return {
    roles:
      options.omitEmptyRoles === true && !hasRoles
        ? undefined
        : {
            customer: flags.customer === true ? {} : undefined,
            vendor: flags.vendor === true ? {} : undefined,
          },
    company: hasCompany
      ? {
          name: flags.companyName,
          taxNumber: flags.companyTaxNumber,
          vatRegistrationId: flags.companyVatRegistrationId,
          allowTaxFreeInvoices: flags.companyAllowTaxFreeInvoices,
          contactPersons: contactCompanyContactPersonFromFlags(flags),
        }
      : undefined,
    person: hasPerson
      ? {
          salutation: flags.personSalutation,
          firstName: flags.personFirstName,
          lastName: flags.personLastName,
        }
      : undefined,
    addresses:
      billing === undefined && shipping === undefined
        ? undefined
        : {
            billing: billing === undefined ? undefined : [billing],
            shipping: shipping === undefined ? undefined : [shipping],
          },
    xRechnung: hasXRechnung
      ? {
          buyerReference: flags.xRechnungBuyerReference,
          vendorNumberAtCustomer: flags.xRechnungVendorNumberAtCustomer,
        }
      : undefined,
    emailAddresses: hasEmailAddresses
      ? {
          business: flags.emailBusiness === undefined ? undefined : [flags.emailBusiness],
          office: flags.emailOffice === undefined ? undefined : [flags.emailOffice],
          private: flags.emailPrivate === undefined ? undefined : [flags.emailPrivate],
          other: flags.emailOther === undefined ? undefined : [flags.emailOther],
        }
      : undefined,
    phoneNumbers: hasPhoneNumbers
      ? {
          business: flags.phoneBusiness === undefined ? undefined : [flags.phoneBusiness],
          office: flags.phoneOffice === undefined ? undefined : [flags.phoneOffice],
          mobile: flags.phoneMobile === undefined ? undefined : [flags.phoneMobile],
          private: flags.phonePrivate === undefined ? undefined : [flags.phonePrivate],
          fax: flags.phoneFax === undefined ? undefined : [flags.phoneFax],
          other: flags.phoneOther === undefined ? undefined : [flags.phoneOther],
        }
      : undefined,
    note: flags.note,
    archived: flags.archived,
    version: flags.version,
  }
}

const contactCompanyCreateCommand = buildCommand({
  func(this: CliCommandContext, flags: ContactCompanyCreateFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: contactBodyInputFromFlags(flags),
      inputSchema: contactCompanyCreateInputSchema,
      execute: contactCompanyCreate,
      op: "contactCompanyCreate",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
      ...contactCommonOptions,
      ...contactCompanyOptions,
    },
  },
  docs: {
    brief: "Create a company contact",
  },
})

const contactPersonCreateCommand = buildCommand({
  func(this: CliCommandContext, flags: ContactPersonCreateFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: contactBodyInputFromFlags(flags),
      inputSchema: contactPersonCreateInputSchema,
      execute: contactPersonCreate,
      op: "contactPersonCreate",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
      ...contactCommonOptions,
      ...contactPersonCreateOptions,
    },
  },
  docs: {
    brief: "Create a person contact",
  },
})

const contactUpdateCommand = buildCommand({
  func(this: CliCommandContext, flags: ContactUpdateFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: { id: flags.id, body: contactBodyInputFromFlags(flags, { omitEmptyRoles: true }) },
      inputSchema: contactUpdateInputSchema,
      execute: (client, input) => contactUpdate(client, input.id, input.body),
      op: "contactUpdate",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
      id: cliOptionCreate(lexwareIdInputSchema.entries.id, "Contact ID"),
      ...contactCommonOptions,
      ...contactCompanyUpdateOptions,
      ...contactPersonOptions,
    },
  },
  docs: {
    brief: "Update a contact",
  },
})

type ContactListFlags = CliClientInput & {
  readonly page?: a.InferOutput<typeof contactListInputSchema.entries.page>
  readonly size?: a.InferOutput<typeof contactListInputSchema.entries.size>
  readonly email?: a.InferOutput<typeof contactListInputSchema.entries.email>
  readonly name?: a.InferOutput<typeof contactListInputSchema.entries.name>
  readonly number?: a.InferOutput<typeof contactListInputSchema.entries.number>
  readonly customer?: a.InferOutput<typeof contactListInputSchema.entries.customer>
  readonly vendor?: a.InferOutput<typeof contactListInputSchema.entries.vendor>
}

type ContactIdFlags = CliClientInput & a.InferOutput<typeof lexwareIdInputSchema>

const contactListCommand = buildCommand({
  func(this: CliCommandContext, flags: ContactListFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: {
        page: flags.page,
        size: flags.size,
        email: flags.email,
        name: flags.name,
        number: flags.number,
        customer: flags.customer,
        vendor: flags.vendor,
      },
      inputSchema: contactListInputSchema,
      execute: contactList,
      op: "contactList",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
      page: cliOptionCreate(
        a.pipe(cliOptionSchemas.integer, a.unwrap(contactListInputSchema.entries.page)),
        "Page number",
        { optional: true },
      ),
      size: cliOptionCreate(
        a.pipe(cliOptionSchemas.integer, a.unwrap(contactListInputSchema.entries.size)),
        "Page size",
        { optional: true },
      ),
      email: cliOptionCreate(a.unwrap(contactListInputSchema.entries.email), "Filter by email", {
        optional: true,
      }),
      name: cliOptionCreate(a.unwrap(contactListInputSchema.entries.name), "Filter by name", {
        optional: true,
      }),
      number: cliOptionCreate(
        a.pipe(cliOptionSchemas.integer, a.unwrap(contactListInputSchema.entries.number)),
        "Filter by contact number",
        { optional: true },
      ),
      customer: cliOptionCreate(
        a.pipe(cliOptionSchemas.boolean, a.unwrap(contactListInputSchema.entries.customer)),
        "Filter customer contacts",
        { optional: true },
      ),
      vendor: cliOptionCreate(
        a.pipe(cliOptionSchemas.boolean, a.unwrap(contactListInputSchema.entries.vendor)),
        "Filter vendor contacts",
        { optional: true },
      ),
    },
  },
  docs: {
    brief: "List contacts",
  },
})

const contactGetCommand = buildCommand({
  func(this: CliCommandContext, flags: ContactIdFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: { id: flags.id },
      inputSchema: lexwareIdInputSchema,
      execute: (client, input) => contactGet(client, input.id),
      op: "contactGet",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
      id: cliOptionCreate(lexwareIdInputSchema.entries.id, "Contact ID"),
    },
  },
  docs: {
    brief: "Get a contact",
  },
})

export const contactCommand = buildRouteMap({
  routes: {
    companyCreate: contactCompanyCreateCommand,
    personCreate: contactPersonCreateCommand,
    update: contactUpdateCommand,
    list: contactListCommand,
    get: contactGetCommand,
  },
  docs: {
    brief: "Contact commands",
  },
})
