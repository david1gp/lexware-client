import { buildCommand, buildRouteMap } from "@stricli/core"
import * as a from "valibot"
import type { CliClientInput } from "../../cli/cliClientCreate.js"
import { cliClientOptions } from "../../cli/cliClientOptions.js"
import type { CliCommandContext } from "../../cli/cliCommandContext.js"
import { cliCommandExecute } from "../../cli/cliCommandExecute.js"
import { cliOptionCreate } from "../../cli/cliOptionCreate.js"
import { lexwareIdInputSchema } from "../../shared/lexwareSchemas.js"
import { salesVoucherDownloadOptions } from "../../shared/salesVoucherDownloadOptions.js"
import { salesVoucherDownloadWrite } from "../../shared/salesVoucherDownloadWrite.js"
import { invoiceCreate } from "../api/invoiceCreate.js"
import { invoiceGet } from "../api/invoiceGet.js"
import { invoicePdfDownload } from "../api/invoicePdfDownload.js"
import { invoiceXmlDownload } from "../api/invoiceXmlDownload.js"
import { invoiceCreateInputSchema } from "../schema/invoiceSchemas.js"
import type { InvoiceCreateInputFlags } from "./invoiceCreateInput.js"
import { invoiceCreateInputFromFlags } from "./invoiceCreateInput.js"
import { invoiceCreateOptions } from "./invoiceCreateOptions.js"

type InvoiceIdFlags = CliClientInput & { readonly id: string }
type InvoiceCreateFlags = CliClientInput & InvoiceCreateInputFlags
type InvoiceDownloadFlags = InvoiceIdFlags & { readonly output?: string }

const invoiceCreateCommand = buildCommand({
  func(this: CliCommandContext, flags: InvoiceCreateFlags) {
    const { accessToken, baseUrl, ...inputFlags } = flags

    return cliCommandExecute(this, {
      clientInput: { accessToken, baseUrl },
      input: invoiceCreateInputFromFlags(inputFlags),
      inputSchema: invoiceCreateInputSchema,
      execute: invoiceCreate,
      op: "invoiceCreate",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
      ...invoiceCreateOptions,
    },
  },
  docs: {
    brief: "Create an invoice",
  },
})

const invoiceGetCommand = buildCommand({
  func(this: CliCommandContext, flags: InvoiceIdFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: { id: flags.id },
      inputSchema: lexwareIdInputSchema,
      execute: (client, input) => invoiceGet(client, input.id),
      op: "invoiceGet",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
      id: cliOptionCreate(lexwareIdInputSchema.entries.id, "Invoice ID"),
    },
  },
  docs: {
    brief: "Get an invoice",
  },
})

function invoiceDownloadCommand(
  download: typeof invoicePdfDownload | typeof invoiceXmlDownload,
  op: "invoicePdfDownload" | "invoiceXmlDownload",
  brief: string,
) {
  return buildCommand({
    func(this: CliCommandContext, flags: InvoiceDownloadFlags) {
      return cliCommandExecute(this, {
        clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
        input: { id: flags.id, output: flags.output },
        inputSchema: a.intersect([lexwareIdInputSchema, a.object({ output: a.optional(a.string()) })]),
        execute: (client, input) => salesVoucherDownloadWrite(client, input.id, input.output, download),
        op,
      })
    },
    parameters: { flags: { ...cliClientOptions, ...salesVoucherDownloadOptions } },
    docs: { brief },
  })
}

export const invoiceCommand = buildRouteMap({
  routes: {
    create: invoiceCreateCommand,
    get: invoiceGetCommand,
    "pdf-download": invoiceDownloadCommand(invoicePdfDownload, "invoicePdfDownload", "Download an invoice PDF"),
    "xml-download": invoiceDownloadCommand(invoiceXmlDownload, "invoiceXmlDownload", "Download an invoice XML"),
  },
  docs: {
    brief: "Invoice commands",
  },
})
